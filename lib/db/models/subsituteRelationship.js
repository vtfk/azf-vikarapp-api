/*
  Import dependencies
*/
const mongoose = require('mongoose')

/*
  Define schema
*/
const substituteRelationshipSchema = new mongoose.Schema({
  school: {
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
const SubstituteRelationsships = mongoose.model('substituteRelationsships', substituteRelationshipSchema);

/*
  Export the model
*/
module.exports = SubstituteRelationsships