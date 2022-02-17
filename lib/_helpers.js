const config = require('../config');
const setupMock = require('../mocks/setupMock')
const { getToken } = require('./appauth')
const { auth } = require('./auth')

const defaultOptions = {
  auth: true,
  mock: false
}


/**
 * 
 * @param { Object } req Azure function request object
 * @param { Object } options
 * @param { Boolean } options.auth Is this a protected route?
 * @returns 
 */
async function prepareRequest(req, options = {}) {
  // Merge default
  if(typeof options !== 'object') options = {};
  options = Object.assign(defaultOptions, options);

  // Variables
  let requestor = undefined;

  // Handle input authentication
  if(options.auth) {
    if(!req) throw new Error('Authentication could not be done because the req object was not provided');
    requestor = await auth(req);
  }

  if(process.env.USE_MOCK === 'true' || options.mock) {
    setupMock();
  }

  return {
    requestor: requestor,
  }
}

module.exports = {
  prepareRequest
}