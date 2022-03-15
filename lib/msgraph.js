const config = require('../config')
const { default: axios } = require('axios')
const { getToken } = require('./appauth')
const { getPermittedLocations } = require('./getPermittedLocations')

async function callMSGraph (request) {
  // Get token
  const token = await getToken()

  // Add authorization to the token
  if (!request.headers) request.headers = {}
  if (!request.headers.Authorization) request.headers.Authorization = token

  // Make the request
  const { data } = await axios.request(request)

  // Return
  return data
}

async function searchUsers (searchTerm, req, requestor) {
  // Prepare the request
  const url = `https://graph.microsoft.com/v1.0/groups/${config.searchGroupId}/members?$search="displayName:${searchTerm}"&$select=id,displayName,jobTitle,officeLocation,userPrincipalName`
  const request = {
    url: url,
    metod: 'get',
    headers: {
      ConsistencyLevel: 'eventual'
    }
  }

  // Make the request and normalize the data
  let data = await callMSGraph(request)
  if (data?.value) data = data.value

  // If not should not return self
  if (!req.query?.returnSelf) data = data.filter((i) => i.userPrincipalName !== requestor.upn); console.log('Filtered out self')

  // If the user is not admin, get the permitted locations
  if (!requestor.roles.includes('App.Admin')) {
    // Get the requestors permitted locations
    const permittedLocations = await getPermittedLocations(requestor)

    // If the requestor has none permitted locations, return an empty array
    if (!permittedLocations || !Array.isArray(permittedLocations) || permittedLocations.length === 0) return []

    // Filter out users that are not part of the permitted locations
    const permittedLocationNames = permittedLocations.map((i) => i.name)
    data = data.filter((i) => permittedLocationNames.includes(i.officeLocation))
  }

  return data
}

module.exports = {
  callMSGraph,
  searchUsers
}
