const { azfHandleResponse, azfHandleError } = require('@vtfk/responsehandlers')
const db = require('../lib/db')

const { prepareRequest } = require('../lib/_helpers')
const { getUser, getOwnedObjects } = require('../lib/msgraph')
const { getPermittedLocations } = require('../lib/getPermittedLocations')
const HTTPError = require('../lib/httperror')
const { activateSubstitutions, logToDB } = require('../lib/common')

module.exports = async function (context, req) {
  let requestor
  try {
    // Prepare the request
    ({ requestor } = await prepareRequest(req))
    if (!req.body || !Array.isArray(req.body)) throw new Error('Forespørselen er feil formatert')

    // Make sure that all the requests are correctly formatted
    for (const substitution of req.body) {
      // The requestor can only setup substitutions for a another teacher if he/she is admin
      if (!requestor.roles.includes('App.Admin') && requestor.upn !== substitution.substituteUpn) {
        throw new Error('Du har ikke rettigheter til å legge inn vikariat for andre enn deg selv')
      }

      if (!substitution.substituteUpn) throw new Error('En eller flere vikariatforespørsler mangler \'substituteUpn\'')
      if (!substitution.substituteUpn.includes('@')) throw new Error(`${substitution.substituteUpn} er ikke ett gyldig upn`)
      if (!substitution.teacherUpn) throw new Error('En eller flere vikariatforespørsler mangler \'teacherUpn\'')
      if (!substitution.teacherUpn.includes('@')) throw new Error(`${substitution.teacherUpn} er ikke ett gyldig upn`)
      if (!substitution.teamId) throw new Error('En eller flere vikariatforespørsler mangler \'teamId\'')
      if (substitution.substituteUpn.toLowerCase() === substitution.teacherUpn.toLowerCase()) throw new Error(`Vikar '${substitution.substituteUpn}' kan ikke være vikar for seg selv`)
    }

    // Connect the database
    await db.connect()

    // Get all unique substitute and teacher UPNS
    const uniqueSubstituteUpns = [...new Set(req.body.map((i) => i.substituteUpn))]
    const uniqueTeacherUpns = [...new Set(req.body.map((i) => i.teacherUpn))]

    // Retreive all required substitute information from MS Graph
    const substitutes = []
    for (const upn of uniqueSubstituteUpns) {
      // Get the substitute from MS graph
      const substitute = await getUser(upn)
      if (!substitute) throw new Error(`Kunne ikke finne vikarlærer '${upn}'`)

      // Attempt to find existing substituions in the database
      const existingSubstitutions = await db.Substitutions.find({ substituteId: substitute.id })
      if (existingSubstitutions) substitute.substitutions = existingSubstitutions

      // If the requestor is not admin, get the substitutes permittedLocations
      if (!requestor.roles.includes('App.Admin')) {
        substitute.permittedLocations = await getPermittedLocations(substitute.companyName)
        if (!substitute.permittedLocations || !Array.isArray(substitute.permittedLocations) || substitute.permittedLocations.length === 0) throw new Error(`Vikar '${upn}' har ikke rettigheter til å vikariere for noen`)
      }

      substitutes.push(substitute)
    }

    // Retreive all required teacher information from MS Graph
    const teachers = []
    for (const upn of uniqueTeacherUpns) {
      // Retreive the teacher information
      const teacher = await getUser(upn)
      if (!teacher || !teacher.id) throw new HTTPError(400, `Kunne ikke finne lærer '${upn}'`)

      // Retreive everything the teacher owns
      let ownedResources = await getOwnedObjects(upn)
      if (!ownedResources) throw new HTTPError(400, `Kunne ikke hente ut hvilke teams som '${upn}' eier`)
      if (ownedResources.value) ownedResources = ownedResources.value

      teacher.owned = ownedResources
      teachers.push(teacher)
    }

    // Create the database requests for creating/renewing the substitutions
    const expirationTimestamp = new Date(new Date().setHours(1, 0, 0, 0) + (2 * 24 * 60 * 60 * 1000)) // Midnight two days in the future
    const newSubstitutions = [] // New substitutions that has not happened before
    const renewedSubstitutions = [] // Renewals of substitutions that has occured before
    for (const substitution of req.body) {
      // Get the substitute and teacher
      const substitute = substitutes.find((i) => i.userPrincipalName === substitution.substituteUpn)
      const teacher = teachers.find((i) => i.userPrincipalName === substitution.teacherUpn)

      // Make sure that the substitute has permissions to substitute for the teacher
      if (!requestor.roles.includes('App.Admin')) {
        if (!Array.isArray(substitute.permittedLocations) || substitute.permittedLocations.length === 0) throw new HTTPError(400, `Klarer ikke å finne ut om vikar har rettigheter til å vikariere for lærer '${teacher.userPrincipalName}'`)
        const permittedNames = substitute.permittedLocations.map((i) => i.name)
        if (!permittedNames.includes(teacher.companyName)) throw new HTTPError(401, `Vikar '${substitute.userPrincipalName}' har ikke rettigheter til å vikariere for '${teacher.userPrincipalName}'`)
      }

      // Verify that the teacher owns the requested team and that it is valid for substitution
      const team = teacher.owned?.find((i) => i.id === substitution.teamId)
      if (!team) throw new HTTPError(400, `Kan ikke sette opp vikariat fordi læreren ikke eier team med id '${substitution.teamId}'`)
      if (!team['@odata.type'] || team['@odata.type'] !== '#microsoft.graph.group') throw new HTTPError(400, `Kan ikke sette opp vikariat fordi ressurs ${substitution.teamId} ikke er en gruppe`)
      if (!team.mail || !team.mail.toLowerCase().startsWith('section_')) throw new HTTPError(400, `Kan ikke sette opp vikariat fordi ressurs ${substitution.teamId} ikke er ett skole team`)

      // Check if the subsitution is currently active and should be extended
      const existingSubstitution = substitute.substitutions?.find((i) => i.teamId === substitution.teamId && i.status !== 'expired')

      if (existingSubstitution) {
        renewedSubstitutions.push({
          _id: existingSubstitution._id,
          expirationTimestamp: expirationTimestamp
        })
      } else {
        let teamSdsId = team.mail
        if (teamSdsId.includes('_')) teamSdsId = teamSdsId.substring(teamSdsId.indexOf('_') + 1)

        newSubstitutions.push({
          status: 'pending',
          teacherId: teacher.id,
          teacherName: teacher.displayName,
          teacherUpn: teacher.userPrincipalName,
          substituteId: substitute.id,
          substituteName: substitute.displayName,
          substituteUpn: substitute.userPrincipalName,
          teamId: team.id,
          teamName: team.displayName,
          teamEmail: team.mail,
          teamSdsId: teamSdsId,
          expirationTimestamp: expirationTimestamp
        })
      }
    }

    // Make requests to the database
    let documents = [] // The documents that will be returned
    if (newSubstitutions.length > 0) {
      console.log('New substitutions', newSubstitutions)
      const result = await db.Substitutions.create(newSubstitutions)
      documents = [...result]
    }
    for (const renewal of renewedSubstitutions) {
      console.log('Renew substitutions', renewedSubstitutions)
      const result = await db.Substitutions.findByIdAndUpdate(renewal._id, renewal, { new: true })
      documents = [...documents, result]
    }

    // Make the request to activate the substitutions in the database
    await activateSubstitutions(false, req, context)

    // Write the request to the database
    logToDB('info', documents, req, context, requestor)

    // Send the response
    return await azfHandleResponse(documents, context, req)
  } catch (err) {
    console.log('Error posting substitution', err)
    await logToDB('error', err, req, context, requestor)
    return await azfHandleError(err, context, req)
  }
}
