/*
  Import dependencies
*/
const HTTPError = require('../../vtfk-errors/httperror')
const config = require('../../../config')

/*
  Validation function
*/
module.exports = (key) => {
  // Validation
  if (!key) throw new HTTPError(401, 'No apikey provided')
  if (!config.APIKEYS) throw new HTTPError(401, 'The provided apikey is invalid')

  // Get all keys that are over 24 keys long
  const keys = config.APIKEYS.split(',').filter(n => n.length >= config.APIKEYS_MINIMUM_LENGTH)
  if (!keys || keys.length === 0) throw new HTTPError(401, 'The provided apikey is invalid')

  const existingKey = keys.find(n => n === key)
  if (!existingKey) throw new HTTPError(401, 'The provided apikey is invalid')
}
