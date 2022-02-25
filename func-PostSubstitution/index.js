const { azfHandleResponse, azfHandleError } = require('@vtfk/responsehandlers')
const db = require('../lib/db')

const { prepareRequest } = require('../lib/_helpers')
const { callMSGraph } = require('../lib/msgraph')

var groupBy = function(xs, key) {
  return xs.reduce(function(rv, x) {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});
};

module.exports = async function (context, req) {
  try {
    // Prepare the request
    const required = ['body.substituteUpn', 'body.substitutions']
    await prepareRequest(req, { required })

    // Calculate when the next expirationTimestamp should be set
    var expirationTimestamp = new Date(new Date().setHours(1,0,0,0) + (2 * 24 * 60 * 60 * 1000))

    // Validation
    if(!Array.isArray(req.body.substitutions) || req.body.substitutions.length === 0) throw new Error(`req.body må være ett array`)

    // Make sure that the substitute exists
    const substitute = await callMSGraph({
      url: `https://graph.microsoft.com/v1.0/users/${req.body.substituteUpn}`
    })
    if(!substitute) throw new Error(`Kunne ikke finne vikarlærer ${req.body.substituteUpn}`)

    // Group the request by teacherUpn
    const groupedRequests = groupBy(req.body.substitutions, 'teacherUpn')
    if(groupedRequests.length === 0) return await azfHandleResponse([], context, req)

    // Connect the database
    await db.connect();

    // Get any existing substitutions
    const existingSubstitutions = await db.Substitutions.find({ substituteId: substitute.id})

    // Any new substitutions discovered below
    const newSubstitutions = [];
    // Any substitutions that should be renewed
    const renewedSubstitutions = [];
    for(const teacherUpn in groupedRequests) {
      // Validation
      if(!teacherUpn || teacherUpn === 'undefined') throw new Error(`Vikariater kan ikke settes opp fordi en eller flere lærer ikke finnes`)
      const teacherRequestGroup = groupedRequests[teacherUpn];
      if(teacherRequestGroup.length === 0) throw new Error(`Vikariater kan ikke settes opp fordi teams for lærer ${teacherUpn} ikke kunne finnes`)
      let teamsIds = []
      teacherRequestGroup.forEach((i) => {
        if(!i.teamId || typeof i.teamId !== 'string') throw new Error(`TeamsId '${i.teamId}' er feil formatert`)
        teamsIds.push(i.teamId)
      })

      // Make sure that the teacher exists
      const teacher = await callMSGraph({
        url: `https://graph.microsoft.com/v1.0/users/${teacherUpn}`
      })
      if(!teacher) throw new Error(`Kunne ikke finne lærer ${teacherUpn}`)
      
      // Make sure that the teacher owns all the teams Ids and that they are SDS-teams
      let teacherOwnedResources = await callMSGraph({
        url: `https://graph.microsoft.com/v1.0/users/${teacherUpn}/ownedObjects?$select=id,displayName,mail`
      })
      if(!teacherOwnedResources) throw new Error(`Kunne ikke hente ut hva ${teacherUpn} eier`)
      if(teacherOwnedResources.value) teacherOwnedResources = teacherOwnedResources.value
      
      // ForEach requested team
      for(const id of teamsIds) {
        const match = teacherOwnedResources.find((owned) => owned.id === id);
        if(!match) throw new Error(`Kan ikke sette opp vikariat fordi læreren ikke eier team ${id}`)
        if(!match['@odata.type'] || match['@odata.type'] !== '#microsoft.graph.group') throw new Error(`Kan ikke sette opp vikariat fordi ressurs ${id} ikke er en gruppe`)
        if(!match.mail || !match.mail.toLowerCase().startsWith('section_')) throw new Error(`Kan ikke sette opp vikariat fordi ressurs ${id} ikke er ett skole team`)

        // Attempt to find an existing substitution
        const existing = existingSubstitutions.find((sub) => sub.teamId === id && sub.status !== 'expired');
        
        // If existing, create a renewal if not create a new document
        if(existing && existing._id) {
          renewedSubstitutions.push({
            _id: existing._id,
            expirationTimestamp: expirationTimestamp
          })
        } else {
          newSubstitutions.push({
            status: 'pending',
            teacherId: teacher.id,
            teacherName: teacher.displayName,
            teacherUpn: teacher.userPrincipalName,
            substituteId: substitute.id,
            substituteName: substitute.displayName,
            substituteUpn: substitute.userPrincipalName,
            teamId: match.id,
            teamName: match.displayName,
            expirationTimestamp: expirationTimestamp
          })
        }
      }
    }

    // Make requests to the database
    let documents = []; // The documents that will be returned
    if(newSubstitutions.length > 0) {
      const result = await db.Substitutions.create(newSubstitutions)
      documents = [...result]
    }
    for(const renewal of renewedSubstitutions) {
      const result = await db.Substitutions.findByIdAndUpdate(renewal._id, renewal, { new: true })
      documents = [...documents, result]
    }

    console.log('New substitutions:', newSubstitutions)
    console.log('Renewed substitutions:', renewedSubstitutions)

    // Send the response
    return await azfHandleResponse(documents, context, req)
  } catch (err) {
    return await azfHandleError(err, context, req)
  }
}
