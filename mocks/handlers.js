// src/mocks/handlers.js
const { rest } = require('msw');
const msgraph = require('./handlers/msgraph');

const handlers = [ ...msgraph ]

module.exports = {
  handlers
}