/*
  Import dependencies
*/
const mongoose = require('mongoose')

/*
  Define schema
*/
const schema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['info', 'error']
  },
  sessionId: String,
  origin: String,
  method: String,
  endpoint: String,
  url: String,
  message: String,
  request: mongoose.Schema.Types.Mixed,
  requestor: mongoose.Schema.Types.Mixed,
  data: mongoose.Schema.Types.Mixed,
  duration: Number,
  startTimestamp: {
    type: Date,
    default: new Date()
  },
  endTimestamp: {
    type: Date
  }
}, { capped: { size: 20971520 } })

/*
  Define the model
*/
const Logs = mongoose.model('logs', schema)

/*
  Export the model
*/
module.exports = Logs
