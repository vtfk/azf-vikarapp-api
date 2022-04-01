/*
  Import dependencies
*/
const mongoose = require('mongoose')

/*
  Define schema
*/
const schema = new mongoose.Schema({
  message: {
    type: String
  },
  request: {
    type: mongoose.Schema.Types.Mixed
  },
  requestor: {
    type: mongoose.Schema.Types.Mixed
  },
  error: {
    type: mongoose.Schema.Types.Mixed
  },
  timestamp: {
    type: Date,
    default: new Date()
  }
})

/*
  Define the model
*/
const Errors = mongoose.model('errors', schema)

/*
  Export the model
*/
module.exports = Errors
