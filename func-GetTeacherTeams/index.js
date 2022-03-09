const { azfHandleResponse, azfHandleError } = require('@vtfk/responsehandlers')
const { prepareRequest } = require('../lib/_helpers')
const { callMSGraph } = require('../lib/msgraph')

module.exports = async function (context, req) {
  try {
    // Prepare the request
    const required = ['params.upn']
    await prepareRequest(req, { required })

    // Make the request
    const request = {
      url: `https://graph.microsoft.com/v1.0/users/${req.params.upn}/ownedObjects?$select=id,displayName,mail,description`,
      metod: 'get',
      headers: {
        ConsistencyLevel: 'eventual'
      }
    }

    const response = await callMSGraph(request)

    // Prepare the response
    let data = response
    if (response?.value) data = response.value

    // Remove every item that is not a SDS team
    data = data.filter((i) => i.mail && i.mail.toLowerCase().startsWith('section_'))

    // Send the response
    return await azfHandleResponse(data, context, req)
  } catch (err) {
    return await azfHandleError(err, context, req)
  }
}
