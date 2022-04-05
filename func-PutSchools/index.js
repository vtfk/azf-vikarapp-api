const { azfHandleResponse, azfHandleError } = require('@vtfk/responsehandlers')
const { logToDB } = require('../lib/common')
const db = require('../lib/db')
const { prepareRequest } = require('../lib/_helpers')

module.exports = async function (context, req) {
  let requestor
  try {
    // Prepare the request
    ({ requestor } = await prepareRequest(req))

    // Connect to dabase
    await db.connect()

    // Update the school
    const data = await db.Schools.findByIdAndUpdate(req.params.id, req.body, { new: true })

    // Write the request to the database
    logToDB('info', data, req, context, requestor)

    // Send the response
    return await azfHandleResponse(data, context, req)
  } catch (err) {
    await logToDB('error', err, req, context, requestor)
    return await azfHandleError(err, context, req)
  }
}
