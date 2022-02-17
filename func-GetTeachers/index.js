const { azfHandleResponse, azfHandleError } = require('@vtfk/responsehandlers')
const { prepareRequest } = require('../lib/_helpers')
const { callMSGraph } = require('../lib/msgraph');
// const { DefaultAzureCredential, VisualStudioCodeCredential, AzureCliCredential, useIdentityPlugin } = require('@azure/identity')
const { default: axios } = require('axios')


module.exports = async function (context, req) {
  try {
    // Prepare the request
    const required = ['params.searchTerm'];
    const { token } = await prepareRequest(req, { required } )

    const term = req.params.searchTerm;

    /*
      Make request
    */
    const request = {
      url: `https://graph.microsoft.com/v1.0/users?$filter=startsWith(displayName,'${term}') OR startsWith(surname,'${term}')&$orderby=displayName&$count=true`,
      metod: 'get',
      headers: {
        ConsistencyLevel: 'eventual'
      }
    }

    const response = await callMSGraph(request);

    /*
      Send response
    */
    let data
    if (response?.value) data = response?.value
    else data = []
    return await azfHandleResponse(data, context, req)
  } catch (err) {
    return await azfHandleError(err, context, req)
  }
}
