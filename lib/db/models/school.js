/*
  Import dependencies
*/
const mongoose = require('mongoose')

/*
  Define schema
*/
const schoolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  permittedSchools: {
    type: [String],
    validate: [(val) => val.length > 0]
  }
})

/*
  Define the model
*/
const Schools = mongoose.model('schools', schoolSchema);

/*
  Export the model
*/
module.exports = Schools