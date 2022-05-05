const config = require('../config')
const { azfHandleResponse, azfHandleError } = require('@vtfk/responsehandlers')
const { prepareRequest } = require('../lib/_helpers')
const { searchUsersInGroup } = require('../lib/msgraph')
const { getPermittedLocations } = require('../lib/getPermittedLocations')
const { logToDB } = require('../lib/common')

module.exports = async function (context, req) {
  let requestor
  try {
    // Prepare the request
    const required = ['params.searchTerm']
    ;({ requestor } = await prepareRequest(req, { required }))
    if (!config.searchGroupId) throw new Error('Kan ikke gjøre søket fordi at miljøvariabel \'AZURE_SEARCH_GROUP_ID\' ikke er konfigurert i APIet')

    // Retreive the search term
    const term = req.params.searchTerm
    if (!term) throw new Error('Du kan ikke gjøre ett tomt søk etter lærer')

    // Do the search;
    let data = await searchUsersInGroup(term, config.searchGroupId, requestor, req.query?.returnSelf)

    // If the user is not admin, filter out any
    if (!requestor.roles.includes('App.Admin')) {
      // Get the requestors permitted locations
      const permittedLocations = await getPermittedLocations(requestor.company)

      // If the requestor has none permitted locations, return an empty array
      if (!permittedLocations || !Array.isArray(permittedLocations) || permittedLocations.length === 0) data = []
      else {
        // Filter out users that are not part of the permitted locations
        const permittedLocationNames = permittedLocations.map((i) => i.name)
        data = data.filter((i) => permittedLocationNames.includes(i.companyName))
      }
    }

    // Send the response
    return await azfHandleResponse(data, context, req)
  } catch (err) {
    logToDB('error', err, req, context, requestor)
    return await azfHandleError(err, context, req)
  }
}
