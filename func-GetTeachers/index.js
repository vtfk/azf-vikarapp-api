const config = require('../config')
const { azfHandleResponse, azfHandleError } = require('@vtfk/responsehandlers')
const { prepareRequest } = require('../lib/_helpers')
const { callMSGraph } = require('../lib/msgraph');
// const { DefaultAzureCredential, VisualStudioCodeCredential, AzureCliCredential, useIdentityPlugin } = require('@azure/identity')
const { default: axios } = require('axios')
const { connect, Schools: SubstituteRelationships } = require('../lib/db');


module.exports = async function (context, req) {
  try {
    // Prepare the request
    const required = ['params.searchTerm'];
    const { requestor } = await prepareRequest(req, { required } )
    if(!config.searchGroupId) throw new Error(`Kan ikke gjøre søket fordi at miljøvariabel 'AZURE_SEARCH_GROUP_ID' ikke er konfigurert i APIet`)

    const term = req.params.searchTerm;

    // Check if we need to filter out some results
    let allowedLocations = [];
    if((!requestor.roles || !requestor.roles.includes('App.Admin') && requestor.officeLocation)) {
      await connect();
      const relationship = await SubstituteRelationships.findOne({ name: requestor.officeLocation }).populate('permittedSchools', '_id name').lean()
      console.log('School', relationship)
      if(relationship) {
        if(relationship?.permittedSchools) allowedLocations = relationship.permittedSchools
        // Add the owners own location to the allowed array if not already present
        if(!allowedLocations.includes(requestor.officeLocation)) {
          const match = relationship.permittedSchools.find((i) => i.name === requestor.officeLocation)
          if(!match) allowedLocations.push({ _id: relationship._id, name: relationship.name})
        }
      }
    }
    console.log('Allowed Locations', allowedLocations)
    /*
      Make request
    */
    const url = `https://graph.microsoft.com/v1.0/groups/${config.searchGroupId}/members?$filter=userPrincipalName ne '${requestor.upn}'&$search="displayName:${term}"`
    const request = {
      url: url,
      metod: 'get',
      headers: {
        ConsistencyLevel: 'eventual'
      }
    }

    const response = await callMSGraph(request);

    // Normalize the data
    let data
    if (response?.value) data = response?.value
    else data = []

    // Determine of any of the search results should be filtered out
    if(Array.isArray(allowedLocations) && allowedLocations.length > 0) {
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
