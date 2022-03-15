/*
  Import dependencies
*/
const { rest } = require('msw');

/*
  Data
*/
const teachers = require('../data/teachers');
const resources = require('../data/resources')

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
  rest.get('https://graph.microsoft.com/v1.0/users/:upn', (req, res, ctx) => {
    const user = teachers.find((i) => i.userPrincipalName === req.params.upn);
    if(!user) return res(undefined);

    return res(ctx.json(user));
  }),
  rest.get('https://graph.microsoft.com/v1.0/groups/:groupid/members*', (req, res, ctx) => {
    return res(
      ctx.json(teachers)
    )
  }),
  rest.get('https://graph.microsoft.com/v1.0/users/:upn/ownedObjects', (req, res, ctx) => {
    // Get the specifed user based on upn  
    const user = teachers.find((i) => i.userPrincipalName === req.params.upn);
    if(!user) return res(ctx.json([]));
    const owned = resources.filter((i) => user.owned.includes(i.id));

    return res(
      ctx.json(owned)
    )
  })
]

module.exports =  handlers;