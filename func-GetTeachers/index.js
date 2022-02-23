const config = require('../config')
const { azfHandleResponse, azfHandleError } = require('@vtfk/responsehandlers')
const { prepareRequest } = require('../lib/_helpers')
const { callMSGraph } = require('../lib/msgraph');
// const { DefaultAzureCredential, VisualStudioCodeCredential, AzureCliCredential, useIdentityPlugin } = require('@azure/identity')
const { default: axios } = require('axios')


module.exports = async function (context, req) {
  try {
    // Prepare the request
    const required = ['params.searchTerm'];
    await prepareRequest(req, { required } )

    const term = req.params.searchTerm;

    /*
      Make request
    */
    const url = `https://graph.microsoft.com/v1.0/groups/${config.searchGroupId}/members?$search="displayName:${term}"`
    const request = {
      url: url,
      metod: 'get',
      headers: {
        ConsistencyLevel: 'eventual'
      }
    }

    const response = await callMSGraph(request);

    // Prepare the data
    let data
    if (response?.value) data = response?.value
    else data = []

    /*
      Send response
    */
    return await azfHandleResponse(data, context, req)
  } catch (err) {
    return await azfHandleError(err, context, req)
  }
}
