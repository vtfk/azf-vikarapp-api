const { azfHandleResponse, azfHandleError } = require('@vtfk/responsehandlers')
const { logErrorToDB } = require('../lib/common')
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

    // Send the response
    return await azfHandleResponse(data, context, req)
  } catch (err) {
    await logErrorToDB(err, req, requestor)
    return await azfHandleError(err, context, req)
  }
}
