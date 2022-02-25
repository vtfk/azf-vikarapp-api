/*
  Import dependencies
*/
const mongoose = require("mongoose");
const config = require('../../config')
const uri =  config.mongoDBConnectionString

/*
  Functions
*/
async function connect() {
  // If the DB is already connected, just return
  if(mongoose.connection.readyState === 1) return;
  // // If  there is already a connection in progress, return that promise
  // if(connectionPromise) return connectionPromise;
  // Attempt to connect to the database
  try {
    const client = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000  
    })
    
    Promise.resolve(client);
  } catch (err) {
    Promise.reject(err);
  }
}

/*
  Events
*/
mongoose.connection.on('connected', () => {
  console.log('✅ Database successfully connected')
})

mongoose.connection.on('disconnected', () => {
  console.log('❌ Database disconnected');
})

mongoose.connection.on('reconnected', function() {
  console.log('ℹ️ Database reconnected');
});

mongoose.connection.on('error', function(err) {
  console.log('MongoDB event error: ' + err);
});

/*
  Export
*/
module.exports = {
  connect,
  SubstituteRelationships: require('./models/subsituteRelationship'),
  Substitutions: require('./models/substitutions')
}