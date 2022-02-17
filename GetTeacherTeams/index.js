const { azfHandleResponse, azfHandleError } = require('@vtfk/responsehandlers')
// const { DefaultAzureCredential, VisualStudioCodeCredential, AzureCliCredential, useIdentityPlugin } = require('@azure/identity')
const { default: axios } = require('axios')

const { prepareRequest } = require('../lib/_helpers')

module.exports = async function (context, req) {
  try {
    // Prepare the request
    const required = ['upn'];
    const { token } = await prepareRequest(req, { required } )

    // Make the request
    const request = {
      url: `https://graph.microsoft.com/v1.0/users/${req.params.upn}/ownedObjects`,
      metod: 'get',
      headers: {
        Authorization: token,
        ConsistencyLevel: 'eventually'
      }
    }

    const response = await axios.request(request)

    // Prepare the response
    let data
    if (response?.data?.value) data = response?.data?.value
    else data = []

    // Send the response
    return await azfHandleResponse(data, context, req)
  } catch (err) {
    return await azfHandleError(err, context, req)
  }
}
