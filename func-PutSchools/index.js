const { azfHandleResponse, azfHandleError } = require('@vtfk/responsehandlers')
const db = require('../lib/db')
const { prepareRequest } = require('../lib/_helpers')

module.exports = async function (context, req) {
  try {
    // Prepare the request
    await prepareRequest(req)

    // Connect to dabase
    await db.connect()

    // Update the school
    const data = await db.Schools.findByIdAndUpdate(req.params.id, req.body, { new: true })

    // Send the response
    return await azfHandleResponse(data, context, req)
  } catch (err) {
    return await azfHandleError(err, context, req)
  }
}
