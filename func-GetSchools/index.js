const { azfHandleResponse, azfHandleError } = require('@vtfk/responsehandlers')
const { prepareRequest } = require('../lib/_helpers')
const { connect, Schools } = require('../lib/db')
const { logErrorToDB } = require('../lib/common')

module.exports = async function (context, req) {
  let requestor
  try {
    // Prepare the request
    ({ requestor } = await prepareRequest(req))

    // Check permissions
    if (!requestor.roles || !requestor.roles.includes('App.Config')) throw new Error('Du har ikke rettigheter til dette endepunktet')

    // Retreive data from database
    await connect()
    const data = await Schools.find().lean() || []

    // Return
    return await azfHandleResponse(data, context, req)
  } catch (err) {
    await logErrorToDB(err, req, requestor)
    return await azfHandleError(err, context, req)
  }
}
