const config = require('../config')
const { azfHandleResponse, azfHandleError } = require('@vtfk/responsehandlers')
const { prepareRequest } = require('../lib/_helpers')
const { callMSGraph } = require('../lib/msgraph')
const { connect, Schools: SubstituteRelationships } = require('../lib/db')

module.exports = async function (context, req) {
  try {
    // Prepare the request
    const required = ['params.searchTerm']
    const { requestor } = await prepareRequest(req, { required })
    if (!config.searchGroupId) throw new Error('Kan ikke gjøre søket fordi at miljøvariabel \'AZURE_SEARCH_GROUP_ID\' ikke er konfigurert i APIet')

    const term = req.params.searchTerm

    // Check if we need to filter out some results
    let allowedLocations = []
    if ((!requestor.roles || !requestor.roles.includes('App.Admin')) && requestor.officeLocation) {
      await connect()
      const relationship = await SubstituteRelationships.findOne({ name: requestor.officeLocation }).populate('permittedSchools', '_id name').lean()

      if (relationship) {
        if (relationship?.permittedSchools) allowedLocations = relationship.permittedSchools
        // Add the owners own location to the allowed array if not already present
        if (!allowedLocations.includes(requestor.officeLocation)) {
          const match = relationship.permittedSchools.find((i) => i.name === requestor.officeLocation)
          if (!match) allowedLocations.push({ _id: relationship._id, name: relationship.name })
        }
      }
    }

    // Check if the requestor can return it self
    let exludeSelfFilter = ''
    if (!req.query?.returnSelf) exludeSelfFilter = `$filter=userPrincipalName ne '${requestor.upn}'&`

    /*
      Make request
    */
    const url = `https://graph.microsoft.com/v1.0/groups/${config.searchGroupId}/members?${exludeSelfFilter}$search="displayName:${term}"&$select=id,displayName,jobTitle,officeLocation,userPrincipalName`
    const request = {
      url: url,
      metod: 'get',
      headers: {
        ConsistencyLevel: 'eventual'
      }
    }

    const response = await callMSGraph(request)

    // Normalize the data
    let data = response
    if (response?.value) data = response?.value

    // Determine of any of the search results should be filtered out
    if (Array.isArray(allowedLocations) && allowedLocations.length > 0) {
      const allowedNames = allowedLocations.map((i) => i.name)
      data = data.filter((entry) => allowedNames.includes(entry.officeLocation))
    }

    /*
      Send response
    */
    return await azfHandleResponse(data, context, req)
  } catch (err) {
    return await azfHandleError(err, context, req)
  }
}
