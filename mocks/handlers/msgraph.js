/*
  Import dependencies
*/
const { rest } = require('msw');

/*
  Handlers
*/
const handlers = [
  rest.post('https://login.microsoftonline.com/*/oauth2/v2.0/token', (req, res, ctx) => {
    return res(
      ctx.json({
        token_type: 'Bearer',
        access_token: 'test'
      })
    )
  }),
  rest.get('https://graph.microsoft.com/v1.0/users/*/ownedObjects', (req, res, ctx) => {
    return res(
      ctx.json(require('../data/getUserTeams'))
    )
  })
]

module.exports =  handlers;