const config = require('../config')
const { azfHandleResponse, azfHandleError } = require('@vtfk/responsehandlers')
const { prepareRequest } = require('../lib/_helpers')
const { searchUsers } = require('../lib/msgraph')

module.exports = async function (context, req) {
  try {
    // Prepare the request
    const required = ['params.searchTerm']
    const { requestor } = await prepareRequest(req, { required })
    if (!config.searchGroupId) throw new Error('Kan ikke gjøre søket fordi at miljøvariabel \'AZURE_SEARCH_GROUP_ID\' ikke er konfigurert i APIet')

    // Retreive the search term
    const term = req.params.searchTerm
    if (!term) throw new Error('Du kan ikke gjøre ett tomt søk etter lærer')

    // Do the search;
    const data = await searchUsers(term, req, requestor)

    // Send the response
    return await azfHandleResponse(data, context, req)
  } catch (err) {
    return await azfHandleError(err, context, req)
  }
}
