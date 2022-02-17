/*
  Import dependencies
*/
const { STATUS_CODES } = require('http')
const { createObjectWithOrderedKeys } = require('./lib/common')

class HTTPError extends Error {
  /**
   *
   * @param {number} statusCode HTTP Statuscode. Default: 400
   * @param {string} message Error message
   * @param {string} title Error title
   * @param {Array} errors String array of error messages
   * @param {*} documentation Link(s) to documentation
   */
  constructor (statusCode = 400, message, title, errors = [], documentation = undefined) {
    super()
    Error.captureStackTrace(this, this.constructor)
    if (title) this.title = title
    if (message) this.message = message || STATUS_CODES[statusCode]
    if (parseInt(statusCode)) this.statusName = toName(parseInt(statusCode))
    if (statusCode) this.statusCode = statusCode
    if (errors && Array.isArray(errors) && errors.length > 0) this.errors = errors
    if (documentation) this.documentation = documentation
  }

  /**
   * Creates an object-representation of this error
   * @returns {object}
   */
  toObject () {
    return createObjectWithOrderedKeys(this, ['title', 'message', 'name', 'statusCode', 'errors'], ['documentation'])
  }

  /**
   * Creates a HTTP response object from this error
   * @returns
   */
  toHTTPResponse () {
    return {
      status: this.statusCode,
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        error: {
          statusName: this.statusName,
          statusCode: this.statusCode,
          title: this.title,
          message: this.message,
          errors: this.errors
        },
        documentation: this.documentation ? this.documentation : {}
      }
    }
  }
}

/**
 * Converts an HTTP status code to an Error `name`.
 * Ex:
 *   302 => "Found"
 *   404 => "NotFoundError"
 *   500 => "InternalServerError"
 */
const toName = (code) => {
  const suffix = (code / 100 | 0) === 4 || (code / 100 | 0) === 5 ? 'Error' : ''
  const statusName = STATUS_CODES[code].replace(/error$/i, '').replace(/ /g, '')
  return `${statusName}${suffix}`
}

module.exports = HTTPError
