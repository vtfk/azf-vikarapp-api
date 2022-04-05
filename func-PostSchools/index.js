const { azfHandleResponse, azfHandleError } = require('@vtfk/responsehandlers')
const { logToDB } = require('../lib/common')
const db = require('../lib/db')

const { prepareRequest } = require('../lib/_helpers')

module.exports = async function (context, req) {
  let requestor
  try {
    // Prepare the request
    const required = ['body.name']

    ;({ requestor } = await prepareRequest(req, { required }))

    // Connect to dabase
    await db.connect()

    // Get all substitupe relationships
    const data = await db.Schools.create(req.body)

    // Write the request to the database
    logToDB('info', data, req, context, requestor)

    // Send the response
    return await azfHandleResponse(data, context, req)
  } catch (err) {
    await logToDB('error', err, req, context, requestor)
    return await azfHandleError(err, context, req)
  }
}
