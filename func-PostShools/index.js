const { azfHandleResponse, azfHandleError } = require('@vtfk/responsehandlers')
const db = require('../lib/db')

const { prepareRequest } = require('../lib/_helpers')

module.exports = async function (context, req) {
  try {
    // Prepare the request
    const required = ['body.name']
    console.log('Body', req.body)
    await prepareRequest(req, { required })

    // Connect to dabase
    await db.connect();

    // Get all substitupe relationships
    const data = await db.Schools.create(req.body)

    // Send the response
    return await azfHandleResponse(data, context, req)
  } catch (err) {
    return await azfHandleError(err, context, req)
  }
}
