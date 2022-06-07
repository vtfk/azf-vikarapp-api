/*
  Import dependencies
*/
const mongoose = require('mongoose')
// mongoose.Promise = global.Promise
const MongoMemoryServer = require('mongodb-memory-server').MongoMemoryServer
const config = require('../../config')

/*
  State & Variables
*/
let client
let connectionPromise // This will be promise when mongoose is connecting
let mongoMemoryServer // The mongoMemoryServer object
const mongoMemoryServerOptions = {
  instance: {
    dbName: 'test',
    port: 9000
  }
}
const mongooseConnectionOptions = { // The mongoose connection options
  serverSelectionTimeoutMS: 15000
}

/*
  Functions
*/
async function connect () {
  // If the DB is already connected, just return
  if (connectionPromise) return connectionPromise
  if (mongoose.connection.readyState === 1) return

  // Create common promise for both the MongoMemoryServer and Mongoose connection
  // resolveConnection will be called when both are completed, in the meantime any calls to connect() will receive this promise.
  let resolveConnection, rejectConnection
  connectionPromise = new Promise((resolve, reject) => { resolveConnection = resolve; rejectConnection = reject })

  try {
    let dbUri = config.mongoDBConnectionString
    if (!dbUri && !mongoMemoryServer) {
      console.log('ℹ️ Creating mock database')
      mongoMemoryServer = await MongoMemoryServer.create(mongoMemoryServerOptions)
      dbUri = mongoMemoryServer.getUri() + 'test'
      console.log('Connecting to mock database: ' + dbUri)
    }

    client = await mongoose.connect(dbUri, mongooseConnectionOptions)
    resolveConnection()
  } catch (err) {
    rejectConnection(err)
  }
}

async function disconnect () {
  console.log('ℹ️ Disconnecting database')
  if (client && client.disconnect) client.disconnect()
  mongoose.disconnect()
  mongoose.connection.close()
  if (mongoMemoryServer) await mongoMemoryServer.stop()
}

/*
  Events
*/
mongoose.connection.on('connected', () => {
  console.log('✅ Database successfully connected')
})

mongoose.connection.on('disconnected', () => {
  console.log('❌ Database disconnected')
})

mongoose.connection.on('reconnected', function () {
  console.log('ℹ️ Database reconnected')
})

mongoose.connection.on('error', function (err) {
  console.log('MongoDB event error: ' + err)
})

/*
  Export
*/
module.exports = {
  connect,
  disconnect,
  Schools: require('./models/school'),
  Substitutions: require('./models/substitutions'),
  Logs: require('./models/log')
}
