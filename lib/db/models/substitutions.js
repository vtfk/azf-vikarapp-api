/*
  Import dependencies
*/
const mongoose = require('mongoose')

/*
  Define schema
*/
const substitutionSchema = new mongoose.Schema({
  status: {
    type: String,
    required: true,
    enum: ['pending', 'active', 'expired'],
    default: 'pending'
  },
  teacherId: {
    type: String,
    required: true
  },
  teacherName: {
    type: String,
    required: true
  },
  teacherUpn: {
    type: String,
    required: true
  },
  substituteId: {
    type: String,
    required: true
  },
  substituteName: {
    type: String,
    required: true
  },
  substituteUpn: {
    type: String,
    required: true
  },
  teamId: {
    type: String,
    required: true
  },
  teamName: {
    type: String,
    required: true
  },
  teamEmail: {
    type: String,
    required: true
  },
  teamSdsId: {
    type: String,
    required: true
  },
  createdTimestamp: {
    type: Date,
    default: new Date()
  },
  expirationTimestamp: {
    type: Date,
    required: true
  },
  updatedTimestamp: {
    type: Date,
    default: new Date()
  }
})

/*
  Define the model
*/
const Substitutions = mongoose.model('substitutions', substitutionSchema)

/*
  Export the model
*/
module.exports = Substitutions
