/*
  Import dependencies
*/
const { rest } = require('msw');

/*
  Handlers
*/
// Get teams for a user
const getUserTeams = rest.get('https://graph.microsoft.com/v1.0/users/*/ownedObjects', (req, res, ctx) => {
  return res(
    ctx.json(require('../data/getUserTeams'))
  )
})

module.exports = [ getUserTeams ]