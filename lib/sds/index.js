/*
  Import dependencies
*/
const { MongoClient } = require('mongodb')
const config = require('../../config')

/*
  State
*/
let client
let connection

async function connect () {
  if (!config.SDS_MONGODB_CONNECTIONSTRING) {
    console.log('No SDS connection string specified')
    return
  }

  client = new MongoClient(config.SDS_MONGODB_CONNECTIONSTRING)
  await client.connect()
  connection = client.db('sds').collection('sds')
  return connection
}

async function getSDSEntry (upn) {
  if (!upn) return
  if (!client || !connection) await connect()

  return await connection.findOne({ userPrincipalName: upn })
}

module.exports = {
  client,
  connect,
  getSDSEntry
}
