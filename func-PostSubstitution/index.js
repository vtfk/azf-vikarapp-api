const { azfHandleResponse, azfHandleError } = require('@vtfk/responsehandlers')
const db = require('../lib/db')

const { prepareRequest } = require('../lib/_helpers')
const { callMSGraph } = require('../lib/msgraph')

module.exports = async function (context, req) {
  try {
    // Prepare the request
    const required = ['body.teacherUpn', 'body.substituteUpn', 'body.teamsIds']
    await prepareRequest(req, { required })

    // Connect to dabase
    await db.connect();

    // Retreive the teacher
    const teacher = await callMSGraph({
      url: `https://graph.microsoft.com/v1.0/users/${req.body.teacherUpn}`
    })
    if(!teacher) throw new Error(`Kunne ikke finne lærer ${req.body.teacherUpn}`)

    // Retreive the substitute
    const substitute = await callMSGraph({
      url: `https://graph.microsoft.com/v1.0/users/${req.body.substituteUpn}`
    })
    if(!substitute) throw new Error(`Kunne ikke finne vikarlærer ${req.body.substituteUpn}`)

    // Retreive the substitutes existing substitutions
    const existingSubstitutions = await db.Substitutions.find({ substituteId: substitute.id})
    console.log('existingSubstitutions', existingSubstitutions)

    // Set the expirationDate to midnight in two days
    var expirationTimestamp = new Date(new Date().setHours(1,0,0,0) + (2 * 24 * 60 * 60 * 1000))

    // Make a substitution request for each team
    const substitutions = []
    for(const teamId of req.body.teamsIds) {
      const team = await callMSGraph({
        url: `https://graph.microsoft.com/v1.0/groups/${teamId}`
      })
      if(!team) throw new Error(`Kunne ikke finne team ${req.body.substituteUpn}`)

      const substitution = {
        status: 'pending',
        teacherId: teacher.id,
        teacherName: teacher.displayName,
        substituteId: substitute.id,
        substituteName: substitute.displayName,
        teamId: team.id,
        teamName: team.displayName,
        expirationTimestamp: expirationTimestamp
      }

      substitutions.push(substitution)
    }

    if(substitutions.length === 0) return await azfHandleResponse([], context, req)

    // Register the substitutions
    const data = await db.Substitutions.create(substitutions)

    // Send the response
    return await azfHandleResponse(data, context, req)
  } catch (err) {
    return await azfHandleError(err, context, req)
  }
}
