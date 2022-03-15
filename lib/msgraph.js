const { default: axios } = require('axios')
const { getToken } = require('./appauth')

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

async function getUser (upn) {
  // Input validation
  if (!upn) throw new Error('Cannot search for a user if \'upn\' is not specified')

  // Prepare the request
  const request = {
    url: `https://graph.microsoft.com/v1.0/users/${upn}`
  }

  // Make the request and normalize the data
  let data = await callMSGraph(request)
  if (data?.value) data = data.value

  return data
}

async function searchUsersInGroup (searchTerm, groupId, requestor, returnSelf) {
  // Input validation
  if (!searchTerm) throw new Error('Must provide a searchTerm to search for users')
  if (!groupId) throw new Error('Cannot search for user in group if "groupId" is not defined')

  // Prepare the request
  const request = {
    url: `https://graph.microsoft.com/v1.0/groups/${groupId}/members?$search="displayName:${searchTerm}"&$select=id,displayName,jobTitle,officeLocation,userPrincipalName`,
    metod: 'get',
    headers: {
      ConsistencyLevel: 'eventual'
    }
  }

  // Make the request and normalize the data
  let data = await callMSGraph(request)
  if (data?.value) data = data.value

  // If not should not return self
  if (!returnSelf) data = data.filter((i) => i.userPrincipalName !== requestor.upn)

  return data
}

async function getOwnedObjects (upn) {
  // Input validation
  if (!upn) throw new Error('Cannot search for a users owned objects if \'upn\' is not specified')

  // Prepare the request
  const request = {
    url: `https://graph.microsoft.com/v1.0/users/${upn}/ownedObjects?$select=id,displayName,mail,description`,
    metod: 'get',
    headers: {
      ConsistencyLevel: 'eventual'
    }
  }

  // Make the request and normalize the data
  let data = await callMSGraph(request)
  if (data?.value) data = data.value

  // Return the data
  return data
}

module.exports = {
  callMSGraph,
  getUser,
  searchUsersInGroup,
  getOwnedObjects
}
