/*
  Import dependencies
*/
const apikey = require('./lib/apikey');
const azuread = require('./lib/azuread');
const HTTPError = require('../vtfk-errors/httperror');

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
  if(req.headers.authorization) {
      const token = await azuread(req.headers.authorization);
      if(token && token.name) requestor.name = token.name;
      if(token && token.oid) requestor.id = token.oid;
      if(token && token.department) requestor.department = token.department;
      if(token && token.upn) requestor.email = token.upn;
  } else if(req.headers['x-api-key']) {
      apikey(req.headers['x-api-key']);
      requestor.name = 'apikey';
      requestor.id = 'apikey';
      requestor.department = 'apikey';
      requestor.email = 'apikey@vtfk.no';
  } 
  else {
    throw new HTTPError(401, 'No authentication token provided');
  }
  return requestor;
}

module.exports.auth = auth;