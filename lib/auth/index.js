/*
  Import dependencies
*/
const apikey = require('./lib/apikey')
const azuread = require('./lib/azuread')
const HTTPError = require('../httperror')

/*
  Auth function
*/
/**
 * Auth's the request
 * @param {object} req Azure function request
 * @returns
 */
async function auth (req) {
  let requestor = {}

  // If test and a requestor has been provided, return that
  if (process.env.NODE_ENV === 'test' && req.requestor) return req.requestor

  if (req.headers.authorization) {
    const token = await azuread(req.headers.authorization)
    requestor = {
      id: token.oid,
      sid: token.onprem_sid,
      ipaddress: token.ipaddr,
      name: token.name,
      upn: token.upn,
      givenName: token.given_name,
      familyName: token.family_name,
      jobTitle: token.jobTitle,
      department: token.department,
      officeLocation: token.officeLocation,
      company: token.company,
      roles: token.roles || [],
      scopes: token.scp?.split(' ') || []
    }
  } else if (req.headers['x-api-key']) {
    apikey(req.headers['x-api-key'])
    requestor.name = 'apikey'
    requestor.id = 'apikey'
    requestor.department = 'apikey'
    requestor.email = 'apikey@vtfk.no'
  } else {
    throw new HTTPError(401, 'No authentication token provided')
  }
  return requestor
}

module.exports.auth = auth
