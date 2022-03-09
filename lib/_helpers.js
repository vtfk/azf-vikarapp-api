const setupMock = require('../mocks/setupMock')
const { auth } = require('./auth')
const get = require('lodash.get')

const defaultOptions = {
  auth: true,
  mock: false
}

/**
 *
 * @param { Object } req Azure function request object
 * @param { Object } options
 * @param { Boolean } options.auth Is this a protected route?
 * @param { [String] } options.required Array of properties that must be provided
 * @returns
 */
async function prepareRequest (req, options = {}) {
  // Merge default
  if (typeof options !== 'object') options = {}
  options = Object.assign({}, defaultOptions, options)

  // Make sure that all required fields are provided
  if (options.required) {
    // Check for missing data
    const missingProperties = []
    options.required.forEach((key) => {
      if (!key || typeof key !== 'string') return
      if (!get(req, key)) missingProperties.push(key)
    })
    // Throw error if data is missing
    if (missingProperties.length > 0) throw new Error(`The request is missing the following properties: ${missingProperties.join(', ')}`)
  }

  // Variables
  let requestor

  // Handle input authentication
  if (options.auth) {
    if (!req) throw new Error('Authentication could not be done because the req object was not provided')
    requestor = await auth(req)
  }

  if (process.env.USE_MOCK === 'true' || options.mock) {
    setupMock()
  }

  return {
    requestor: requestor
  }
}

module.exports = {
  prepareRequest
}
