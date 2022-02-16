const { azfHandleResponse, azfHandleError } = require('@vtfk/responsehandlers')
// const { DefaultAzureCredential, VisualStudioCodeCredential, AzureCliCredential, useIdentityPlugin } = require('@azure/identity')
const { default: axios } = require('axios')

module.exports = async function (context, req) {
  try {
    if (!req.params.upn) throw new Error('No UPN was provided')

    const request = {
      url: `https://graph.microsoft.com/v1.0/users/${req.params.upn}/ownedObjects`,
      metod: 'get',
      headers: {
        ConsistencyLevel: 'eventually'
      }
    }

    const response = await axios.request(request)

    let data
    if (response?.data?.value) data = response?.data?.value
    else data = []

    return await azfHandleResponse(data, context, req)
  } catch (err) {
    return await azfHandleError(err, context, req)
  }
}
