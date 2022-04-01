const { addGroupOwner, removeGroupOwner, getGroupOwners } = require('../msgraph')
const { connect, Substitutions } = require('../db')

async function activateSubstitutions (onlyFirst = false) {
  // Connect tot the database
  await connect()

  // Define the query
  let query = { status: 'pending' }

  // Find all pending substitutions
  let pendingSubstitutions = await Substitutions.find(query)

  // If only first
  if(onlyFirst && pendingSubstitutions.length > 0) pendingSubstitutions = [pendingSubstitutions[0]];

  // Holds the response and error
  const responses = [];
  const error = {
    errors: []
  }

  // For each of the pending substitutions
  for (const substitution of pendingSubstitutions) {
    try {
      if (!substitution.teamId) error.errors.push(new Error(`AUDIT LOG: Substitution '${substitution._id}' missing teamId`))
      if (!substitution.substituteId) error.errors.push(new Error(`AUDIT LOG: Substitution '${substitution.substituteId}' missing substituteId`))

      await addGroupOwner(substitution.teamId, substitution.substituteId)

      const tmp = await Substitutions.findByIdAndUpdate(substitution._id, { status: 'active', updatedTimestamp: new Date() }, { new: true })
      responses.push(tmp);
    } catch (err) {
      error.errors.push(err)
    }
  }

  // Logg the errors to the database
  if (error.errors.length > 0) throw error;

  // Return the response
  return responses
}

async function deactivateSubstitutions (onlyFirst = false) {
  // Define the query
  // Find all substitutions that are active and that the expirationTimestamp is less than the current time
  let query = { status: 'active', expirationTimestamp: { $lte: new Date() } }

  // Find all pending substitutions
  let pendingSubstitutions = await Substitutions.find(query)

  // If only first
  if(onlyFirst && pendingSubstitutions.length > 0) pendingSubstitutions = [pendingSubstitutions[0]];
  
  const responses = [];
  const error = {
    errors: []
  }

  // For each of the pending substitutions
  for (const substitution of pendingSubstitutions) {
    try {
      if (!substitution.teamId) error.errors.push(new Error(`AUDIT LOG: Substitution '${substitution._id}' missing teamId`))
      if (!substitution.substituteId) error.errors.push(new Error(`AUDIT LOG: Substitution '${substitution.substituteId}' missing substituteId`))

      // Make sure that the substitute is already a owner
      const owners = await getGroupOwners(substitution.teamId);
      const existingOwner = owners.find((i) => i.id === substitution.substituteId);

      // If the substitute is a owner, remove
      if(existingOwner) {   
        //TODO: Check SDS if the user should permanently be a member, in that case, just expire the record without removing the teacher
        const isPermanentTeacher = false;

        // Remove the group owner
        if(!isPermanentTeacher) await removeGroupOwner(substitution.teamId, substitution.substituteId)
      }

      // Set the substitution entry to expired
      const tmp = await Substitutions.findByIdAndUpdate(substitution._id, { status: 'expired', updatedTimestamp: new Date() }, { new: true })

      // Add the update response
      responses.push(tmp);
    } catch (err) {
      error.errors.push(err)
    }
  }

  // Logg the errors to the database
  if (error.errors.length > 0) throw error;

  // Return the response
  return responses
}

module.exports = {
  activateSubstitutions,
  deactivateSubstitutions
}
