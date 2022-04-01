/*
  Import dependencies
*/
const mongoose = require('mongoose')

/*
  Define schema
*/
const schema = new mongoose.Schema({
  // substitution: {
  //   type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'substitutions' }],
  // },
  message: {
    type: String,
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
