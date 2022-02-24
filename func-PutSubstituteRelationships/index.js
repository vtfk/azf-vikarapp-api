const { azfHandleResponse, azfHandleError } = require('@vtfk/responsehandlers')
const db = require('../lib/db')

const { prepareRequest } = require('../lib/_helpers')
const { callMSGraph } = require('../lib/msgraph')

module.exports = async function (context, req) {
  try {
    // Prepare the request
    await prepareRequest(req)

    // Connect to dabase
    await db.connect();

    // Get all substitupe relationships
    const data = await db.SubstituteRelationships.findByIdAndUpdate(req.params.id, req.body)

    // Send the response
    return await azfHandleResponse(data, context, req)
  } catch (err) {
    return await azfHandleError(err, context, req)
  }
}
