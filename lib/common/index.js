const { addGroupOwner, removeGroupOwner, getGroupOwners } = require('../msgraph')
const { connect, Substitutions, Logs } = require('../db')
const { parseError } = require('@vtfk/responsehandlers')
const { removeKeys } = require('@vtfk/utilities')

async function activateSubstitutions (onlyFirst = false, req, ctx) {
  // Connect tot the database
  await connect()

  // Define the query
  const query = { status: 'pending' }

  // Find all pending substitutions
  let pendingSubstitutions = await Substitutions.find(query)

  // If only first
  if (onlyFirst && pendingSubstitutions.length > 0) pendingSubstitutions = [pendingSubstitutions[0]]

  // Holds the response and error
  const responses = []
  const error = {
    errors: []
  }

  // For each of the pending substitutions
  for (const substitution of pendingSubstitutions) {
    try {
      if (!substitution.teamId) throw new Error(`Substitution '${substitution._id}' missing teamId`)
      if (!substitution.substituteId) throw new Error(`AUDIT LOG: Substitution '${substitution.substituteId}' missing substituteId`)

      await addGroupOwner(substitution.teamId, substitution.substituteId)

      const tmp = await Substitutions.findByIdAndUpdate(substitution._id, { status: 'active', updatedTimestamp: new Date() }, { new: true })
      responses.push(tmp)
    } catch (err) {
      if(ctx?.log && typeof ctx.log === 'function') ctx.log('Error activating substitution', substitution)
      logToDB('error', err, req, ctx)
    }
  }

  await logToDB('info', { message: `Activated '${responses.length}' substitutions`, ids: responses }, req, ctx)

  // Return the response
  return responses
}

async function deactivateSubstitutions (onlyFirst = false, substitutions, req, ctx) {
  // Connect the database
  await connect()
  // Find all substitutions that are active and that the expirationTimestamp is less than the current time
  const query = { status: 'active', expirationTimestamp: { $lte: new Date() } }

  // Find all pending substitutions
  if (!substitutions) substitutions = await Substitutions.find(query).lean()

  // If only first
  if (onlyFirst && substitutions.length > 0) substitutions = [substitutions[0]]

  const responses = []
  const error = {
    errors: []
  }

  // For each of the pending substitutions
  for (const substitution of substitutions) {
    try {
      if (!substitution.teamId) error.errors.push(new Error(`Substitution '${substitution._id}' missing teamId`))
      if (!substitution.substituteId) error.errors.push(new Error(`Substitution '${substitution.substituteId}' missing substituteId`))

      // Make sure that the substitute is already a owner
      const owners = await getGroupOwners(substitution.teamId)
      const existingOwner = owners.find((i) => i.id === substitution.substituteId)

      // If the substitute is a owner, remove
      if (existingOwner) {
        // TODO: Check SDS if the user should permanently be a member, in that case, just expire the record without removing the teacher
        const isPermanentTeacher = false

        // Remove the group owner
        if (!isPermanentTeacher) await removeGroupOwner(substitution.teamId, substitution.substituteId)
      }

      // Set the substitution entry to expired
      const tmp = await Substitutions.findByIdAndUpdate(substitution._id, { status: 'expired', updatedTimestamp: new Date() }, { new: true })

      // Add the update response
      responses.push(tmp)
    } catch (err) {
      console.log(`Error deactivating substitution ${substitution._id}`, err)
      logToDB('error', err, req, ctx)
    }
  }

  await logToDB('info', { message: `Deactivated '${responses.length}' substitutions`, ids: responses }, req, ctx)

  // Return the response
  return responses
}

async function logToDB (type = 'info', data, req, ctx, requestor) {
  if (!data) return
  if (Array.isArray(data)) data = data[0]

  try {
    // Retreive information
    const sessionId = ctx?.invocationId || 'unknown'
    const endpoint = ctx?.executionContext?.functionName || 'unknown'
    const request = removeKeys(req, ['headers', 'rawBody'])
    const method = req?.method || ctx?.req?.method || 'unknown'
    const origin = req?.headers?.origin || req?.headers?.referer || ctx?.req?.headers?.origin || ctx?.req?.headers?.referer || 'unknown'
    const url = req?.url || req?.originalUrl || ctx?.req?.url || ctx?.req?.originalUrl || 'unknown'
    let startTimestamp = ctx?.bindingData?.sys?.utcNow
    const endTimestamp = new Date()
    let duration = 0
    if (startTimestamp) {
      startTimestamp = Date.parse(startTimestamp)
      if (startTimestamp) duration = endTimestamp - new Date(startTimestamp)
    }

    // Prepare the entries
    const entry = {
      type: type,
      message: data?.message || '',
      sessionId,
      origin,
      method,
      endpoint,
      url,
      request,
      requestor,
      duration,
      data: type === 'error' ? parseError(data) : data,
      startTimestamp,
      endTimestamp
    }

    // Write the entries to the database
    await connect()
    await Logs.create(entry)
  } catch (err) {
    console.log('Error logging', err)
  }
}

module.exports = {
  activateSubstitutions,
  deactivateSubstitutions,
  logToDB
}
