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
  USE_MOCK: process.env.USE_MOCK || false
}
