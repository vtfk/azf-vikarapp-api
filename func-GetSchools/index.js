const { azfHandleResponse, azfHandleError } = require('@vtfk/responsehandlers')
const { prepareRequest } = require('../lib/_helpers')
const { connect, Schools } = require('../lib/db')

module.exports = async function (context, req) {
  try {
    // Prepare the request
    const { requestor } = await prepareRequest(req)

    // Check permissions
    if (!requestor.roles || !requestor.roles.includes('App.Config')) throw new Error('Du har ikke rettigheter til dette endepunktet')

    // Retreive data from database
    await connect()
    const data = await Schools.find() || []

    // Return
    return await azfHandleResponse(data, context, req)
  } catch (err) {
    return await azfHandleError(err, context, req)
  }
}
