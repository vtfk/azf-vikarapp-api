const { azfHandleResponse, azfHandleError } = require('@vtfk/responsehandlers')
const { prepareRequest } = require('../lib/_helpers')
const { getOwnedObjects } = require('../lib/msgraph')

module.exports = async function (context, req) {
  try {
    // Prepare the request
    const required = ['params.upn']
    await prepareRequest(req, { required })

    // Retreive the owned objects
    let data = await getOwnedObjects(req.params.upn)

    // Filter out any resources that is not an SDS team
    data = data.filter((i) => i.mail && i.mail.toLowerCase().startsWith('section_'))

    // Send the response
    return await azfHandleResponse(data, context, req)
  } catch (err) {
    return await azfHandleError(err, context, req)
  }
}
