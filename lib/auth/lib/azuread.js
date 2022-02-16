const { verify } = require('azure-ad-verify-token')
const HTTPError = require('../../vtfk-errors/httperror')
const config = require('../../../config')

/**
 *
 * @param {string} authHeader Authentication header
 */
module.exports = async (authHeader) => {
  // Input validation
  const bearerToken = authHeader
  if (!bearerToken) throw new HTTPError(401, 'authentication token missing')
  if (typeof bearerToken !== 'string') throw new HTTPError(401, 'authentication token is not a string')
  if (!bearerToken.startsWith('Bearer')) throw new HTTPError(401, 'authentication token is not a Bearer token')

  // Validation
  let validatedToken
  try {
    validatedToken = await verify(bearerToken.replace('Bearer ', ''), config.AZUREAD_TOKEN_CONFIG)
  } catch (err) {
    throw new HTTPError(401, 'The token is invalid')
  }

  if (!validatedToken) throw new HTTPError(401, 'Could not validate authentication token')
  if (!validatedToken.groups || validatedToken.groups.length === 0) throw new HTTPError(401, 'No groups could be found in authentication token')
  if (!validatedToken.department) throw new HTTPError(401, 'Could not find the users company department in the authentication token')

  // If allowed groups
  if (config.AZUREAD_ALLOWEDGROUPS) {
    const allowedGroups = config.AZUREAD_ALLOWEDGROUPS.split(',').filter(n => n)
    let found = false
    for (const userGroup of validatedToken.groups) {
      if (allowedGroups.includes(userGroup)) found = true
    }
    if (!found) throw new HTTPError(401, 'Your account is not a member of any allowed groups')
  }

  return validatedToken
}
