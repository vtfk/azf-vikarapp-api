const { azfHandleResponse, azfHandleError } = require('@vtfk/responsehandlers')
const { prepareRequest } = require('../lib/_helpers')
const { logToDB } = require('../lib/common')
const { Logs } = require('../lib/db')

module.exports = async function (context, req) {
  let requestor
  try {
    // Prepare the request
    ;({ requestor } = await prepareRequest(req))
    // if (!requestor.roles.includes('App.Admin')) throw new HTTPError(401, 'Du har ikke rettigheter til å gjennomføre denne handlingen')

    const data = await Logs.find({})

    // Send the response
    return await azfHandleResponse(data, context, req)
  } catch (err) {
    logToDB('error', err, req, context, requestor)
    return await azfHandleError(err, context, req)
  }
}
