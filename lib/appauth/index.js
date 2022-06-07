/*
  Import dependencies
*/
const { default: axios } = require('axios')
const { azureApplication } = require('../../config')
const NodeCache = require('node-cache')
const qs = require('qs')

/*
  Declarations
*/
const cacheKey = 'appGraphToken'
const cache = new NodeCache({ stdTTL: 3000 })

/**
 * Retreives a Bearer token for the application
 */
async function getToken () {
  // Validation
  if (process.env.NODE_ENV !== 'test') {
    if (!azureApplication.tenantId) throw new Error('Cannot authenticate because AZURE_TENANT_ID is not defined')
    if (!azureApplication.clientId) throw new Error('Cannot authenticate because AZURE_CLIENT_ID is not defined')
  }

  // Return cached token if applicable
  try {
    const cachedGraphToken = cache.get(cacheKey)
    if (cachedGraphToken) return cachedGraphToken
  } catch {}

  // Define the HTTP request for a access token
  const request = {
    url: `https://login.microsoftonline.com/${azureApplication.tenantId}/oauth2/v2.0/token`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    data: qs.stringify(
      {
        client_id: azureApplication.clientId,
        client_secret: azureApplication.clientSecret,
        scope: azureApplication.scope,
        grant_type: azureApplication.grantType
      }
    )
  }

  // Make and validate the request
  const { data } = await axios(request)

  if (!data || !data.access_token) throw new Error('Azure AD did not return a accessToken')

  // Create the token
  const token = `${data.token_type} ${data.access_token}`.trim()

  // Save the token to the cache
  try { cache.set(cacheKey, token, data.expires_in || 3000) } catch {}

  // Return the token
  return token
}

module.exports = {
  getToken
}
