const { azfHandleResponse, azfHandleError } = require('@vtfk/responsehandlers')
const db = require('../lib/db')
const HTTPError = require('../lib/httperror')

const { prepareRequest } = require('../lib/_helpers')
const { callMSGraph } = require('../lib/msgraph')

module.exports = async function (context, req) {
  try {
    // Prepare the request
    const { requestor } = await prepareRequest(req)

    // Connect to dabase
    await db.connect();

    // Get the substitute and teacher upn from the query
    const status = req.query.status;
    const substituteUpn = req.query.substituteUpn;
    const teacherUpn = req.query.teacherUpn;

    // If the requestor is not admin, make sure that it has permissions for the call
    if(!requestor.roles.includes('App.Admin')) {
      if(!substituteUpn && !teacherUpn) throw new HTTPError(401, 'Du har ikke rettigheter til å søke etter alle vikarieter', 'Søk etter vikariat feilet')
      if(substituteUpn !== requestor.upn && teacherUpn !== requestor.upn) throw new HTTPError(401, 'Du har ikke rettigheter til å søke vikariat hvor du selv ikke er lærer eller vikar', 'Søk etter vikariat feilet')
    }

    // Define the filter
    let filter = []
    if(status) { filter.push({ status: status })}
    if(substituteUpn) { filter.push({ substituteUpn: substituteUpn })}
    if(teacherUpn) { filter.push({ teacherUpn: teacherUpn })}

    // Make the database request
    const data = await db.Substitutions.find({ $and: [...filter]})

    // Send the response
    return await azfHandleResponse(data, context, req)
  } catch (err) {
    return await azfHandleError(err, context, req)
  }
}
