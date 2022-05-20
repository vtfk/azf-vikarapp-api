const { default: axios } = require('axios')
const { getToken } = require('./appauth')

async function callMSGraph (request) {
  // Get token
  const token = await getToken()

  // Add authorization to the token
  if (!request.headers) request.headers = {}
  if (!request.headers.Authorization) request.headers.Authorization = token
  if (!request.headers['Content-type']) request.headers['Content-type'] = 'application/json'

  // Make the request
  let { data } = await axios.request(request)
  if (data?.value) data = data.value

  // Return
  return data
}

async function getUser (upn) {
  // Input validation
  if (!upn) throw new Error('Cannot search for a user if \'upn\' is not specified')

  // Prepare the request
  const request = {
    url: `https://graph.microsoft.com/v1.0/users/${upn}?$select=id,displayName,givenName,surname,userPrincipalName,companyName,officeLocation,preferredLanguage,mail,jobTitle,mobilePhone,businessPhones`
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
    url: `https://graph.microsoft.com/v1.0/groups/${groupId}/members?$search="displayName:${searchTerm}"&$select=id,displayName,jobTitle,officeLocation,userPrincipalName,companyName&$orderby=displayName`,
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

async function getGroup (id) {
  // Input validation
  if (!id) throw new Error('Cannot get group members if no groupId is provided')

  // Prepare the request
  const request = {
    url: `https://graph.microsoft.com/v1.0/groups/${id}`,
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

async function getGroupMembers (id) {
  // Input validation
  if (!id) throw new Error('Cannot get group members if no groupId is provided')

  // Prepare the request
  const request = {
    url: `https://graph.microsoft.com/v1.0/groups/${id}/members`,
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

async function getGroupOwners (id) {
  // Input validation
  if (!id) throw new Error('Cannot get group members if no groupId is provided')

  // Prepare the request
  const request = {
    url: `https://graph.microsoft.com/v1.0/groups/${id}/owners`,
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

async function addGroupOwner (groupId, userId) {
  // Input validation
  if (!groupId || typeof groupId !== 'string') throw new Error(`groupId '${groupId}' is not valid`)
  if (!userId || typeof userId !== 'string') throw new Error(`userId '${userId}' is not valid`)

  // Check if the user exists
  const user = await getUser(userId)
  if (!user) throw new Error(`The user with id '${userId} could not be found'`)

  // Check if the team exists and get its members
  let owners = []
  try {
    owners = await getGroupOwners(groupId)
    if (!owners) throw new Error(`The team '${groupId}' could not be found`)
  } catch { throw new Error(`The team '${groupId}' could not be found`) }

  // Check if the user is already a owner
  const existing = owners.find((i) => i.id === userId)
  if (existing) return { message: 'The user is already a owner' }

  // Add the member of not already member
  const request = {
    url: `https://graph.microsoft.com/v1.0/groups/${groupId}/owners/$ref`,
    method: 'POST',
    data: {
      '@odata.id': `https://graph.microsoft.com/v1.0/users/${userId}`
    }
  }

  // Make the request
  const data = await callMSGraph(request)

  // Return the data
  return data
}

async function removeGroupOwner (groupId, userId) {
  // Input validation
  if (!groupId || typeof groupId !== 'string') throw new Error(`groupId '${groupId}' is not valid`)
  if (!userId || typeof userId !== 'string') throw new Error(`userId '${userId}' is not valid`)

  // Prepare the request
  const request = {
    url: `https://graph.microsoft.com/v1.0/groups/${groupId}/owners/${userId}/$ref`,
    method: 'DELETE'
  }

  // Make the request
  const data = await callMSGraph(request)

  // Return the response
  return data
}

async function removeGroupMember (groupId, userId) {
  // Input validation
  if (!groupId || typeof groupId !== 'string') throw new Error(`groupId '${groupId}' is not valid`)
  if (!userId || typeof userId !== 'string') throw new Error(`userId '${userId}' is not valid`)

  // Prepare the request
  const request = {
    url: `https://graph.microsoft.com/v1.0/groups/${groupId}/members/${userId}/$ref`,
    method: 'DELETE'
  }

  // Make the request
  const data = await callMSGraph(request)

  // Return the response
  return data
}

module.exports = {
  callMSGraph,
  getUser,
  searchUsersInGroup,
  getOwnedObjects,
  getGroup,
  getGroupMembers,
  getGroupOwners,
  addGroupOwner,
  removeGroupOwner,
  removeGroupMember
}
