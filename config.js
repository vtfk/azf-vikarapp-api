/*
  Import dependencies
*/
const path = require('path')
const fs = require('fs')
const envPath = path.resolve(__dirname, `.env.${process.env.NODE_ENV}`)
if (fs.existsSync(envPath)) require('dotenv').config({ path: envPath })
else require('dotenv').config()

/*
  Export config
*/
module.exports = {
  USE_MOCK: process.env.USE_MOCK || false,
  azureApplication: {
    tenantId: process.env.AZURE_APP_TENANT_ID,
    clientId: process.env.AZURE_APP_ID,
    clientSecret: process.env.AZURE_APP_SECRET,
    scope: process.env.AZURE_APP_SCOPE || 'https://graph.microsoft.com/.default',
    grantType: process.env.AZURE_APP_GRANT_TYPE || 'client_credentials',
    issuer: `https://sts.windows.net/${process.env.AZURE_APP_TENANT_ID}/`,
    jwkUri: `https://login.microsoftonline.com/${process.env.AZURE_APP_TENANT_ID}/discovery/v2.0/keys`
  }
}
