const { addGroupOwner, removeGroupOwner, getGroupOwners, getGroupMembers, removeGroupMember } = require('../msgraph')
const { connect, Substitutions, Logs } = require('../db')
const { connect: connectSDS, getSDSEntry } = require('../sds')
const { parseError } = require('@vtfk/responsehandlers')
const { removeKeys } = require('@vtfk/utilities')
const config = require('../../config')
const { default: axios } = require('axios')

async function activateSubstitutions (onlyFirst = false, req, ctx) {
  // Connect tot the database
  await connect()

  // Define the query
  const query = { status: 'pending' }

  // Find all pending substitutions
  let pendingSubstitutions = await Substitutions.find(query)
  if (!pendingSubstitutions || pendingSubstitutions.length === 0) return

  // If only first
  if (onlyFirst && pendingSubstitutions.length > 0) pendingSubstitutions = [pendingSubstitutions[0]]

  // Holds the response and error
  const responses = []

  // For each of the pending substitutions
  const e18Tasks = []
  for (const substitution of pendingSubstitutions) {
    try {
      if (!substitution.teamId) throw new Error(`Substitution '${substitution._id}' missing teamId`)
      if (!substitution.substituteId) throw new Error(`AUDIT LOG: Substitution '${substitution.substituteId}' missing substituteId`)

      await addGroupOwner(substitution.teamId, substitution.substituteId)

      const tmp = await Substitutions.findByIdAndUpdate(substitution._id, { status: 'active', updatedTimestamp: new Date() }, { new: true })
      responses.push(tmp)

      e18Tasks.push({
        system: 'vikarapp',
        method: 'activate_substitution',
        status: 'completed',
        data: tmp
      })
    } catch (err) {
      if (ctx?.log && typeof ctx.log === 'function') ctx.log('Error activating substitution', substitution)
      e18Tasks.push({
        system: config.E18_SYSTEM || 'vikarapp',
        method: 'activate_substitution',
        status: 'failed',
        error: err
      })
      logToDB('error', err, req, ctx)
    }
  }

  await logToDB('info', { message: `Activated '${responses.length}' substitutions`, substitutions: responses }, req, ctx)

  // If applicable log to E18
  if (e18Tasks.length > 0) {
    await logE18Job({
      status: 'completed',
      type: 'activate_substitutions',
      tasks: e18Tasks
    })
  }

  // Return the response
  return responses
}

async function deactivateSubstitutions (onlyFirst = false, substitutions, req, ctx) {
  // Connect the VikarApp and SDS database
  await connect()

  let sdsDBConnected = false
  if (config.SDS_MONGODB_CONNECTIONSTRING) {
    try {
      await connectSDS()
      sdsDBConnected = true
    } catch (err) {
      console.log('Unable to connect to SDS database', err)
      throw new Error(`Unable to connect to SDS database\n${JSON.stringify(err, null, 2)}`)
    }
  }

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
  const e18Tasks = []

  // For each of the pending substitutions
  const SDSCache = {} // Cache for all retreived SDS records
  for (const substitution of substitutions) {
    try {
      if (!substitution.teamId) error.errors.push(new Error(`Substitution '${substitution._id}' missing teamId`))
      if (!substitution.substituteId) error.errors.push(new Error(`Substitution '${substitution.substituteId}' missing substituteId`))

      // Make sure that the substitute is already a owner
      const owners = await getGroupOwners(substitution.teamId)
      const members = await getGroupMembers(substitution.teamId)
      const existingOwner = owners.find((i) => i.id === substitution.substituteId)
      const existingMember = members.find((i) => i.id === substitution.substituteId)

      // If the substitute is a owner, remove
      if (existingOwner || existingMember) {
        let shouldBeRemovedAsOwner = true
        /*
          If applicable check SDS (School-data-sync) if the teacher should continue beeing a owner of the team
        */
        if (config.SDS_MONGODB_CONNECTIONSTRING) {
          if (substitution.teamEmail && sdsDBConnected) {
            try {
            // Check the SDS cache
              let sdsEntry = SDSCache[substitution.substituteUpn]
              // If not cached, attempt to retreive
              if (!sdsEntry) {
                sdsEntry = await getSDSEntry(substitution.substituteUpn)
                SDSCache[substitution.substituteUpn] = sdsEntry
              }
              // If the teacher has a entry
              if (sdsEntry?.sds) {
              // Make sure that the SDS key is a array
                if (!Array.isArray(sdsEntry.sds)) sdsEntry.sds = [sdsEntry.sds]

                // Retreive all the enrollments
                const enrollments = sdsEntry.sds.map((i) => i.enrollments).flat(3)

                // Determine what to searchfor
                let sectionId = substitution.teamEmail
                if (sectionId.toLowerCase().startsWith('section_')) sectionId = sectionId.substring('section_'.length)
                if (sectionId.includes('@')) sectionId = sectionId.substring(0, sectionId.indexOf('@'))

                // Attempt to find a match
                const match = enrollments.find((i) => i.sectionId === sectionId)
                if (!match) shouldBeRemovedAsOwner = false
              }
            } catch (err) {
              logToDB('error', { message: `Unable to receive SDSEntry for '${substitution.substituteUpn}'`, error: err })
            }
          }
        }

        // Remove the group owner
        if (shouldBeRemovedAsOwner) {
          if (existingOwner) await removeGroupOwner(substitution.teamId, substitution.substituteId)
          if (existingMember) await removeGroupMember(substitution.teamId, substitution.substituteId)
        }
      }

      // Set the substitution entry to expired
      const tmp = await Substitutions.findByIdAndUpdate(substitution._id, { status: 'expired', updatedTimestamp: new Date() }, { new: true })

      // Add the update response
      responses.push(tmp)

      e18Tasks.push({
        system: 'vikarapp',
        method: 'deactivate_substitution',
        status: 'completed',
        data: tmp
      })
    } catch (err) {
      console.log(`Error deactivating substitution ${substitution._id}`, err)
      await logToDB('error', err, req, ctx)
      e18Tasks.push({
        system: 'vikarapp',
        method: 'deactivate_substitution',
        status: 'failed',
        data: err
      })
    }
  }

  await logToDB('info', { message: `Deactivated '${responses.length}' substitutions`, substitutions: responses }, req, ctx)

  // Log to E18 if applicable
  if (e18Tasks.length > 0) {
    await logE18Job({
      status: 'completed',
      type: 'deactivate_substitutions',
      tasks: e18Tasks
    })
  }

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

/**
 * Post a job to an E18 queue, some field will be attempted inferred by enviornment variables and otherdata
 * @param {E18Job} job
 */
async function logE18Job (job) {
  if (!config.E18_URL) return
  if (!config.E18_KEY) return
  if (!job) return
  if (!job.tasks || !Array.isArray(job.tasks) || job.tasks.length === 0) return

  // Set some defaults
  job.system = job.system || config.E18_SYSTEM
  job.projectId = parseInt(job.projectId || config.E18_PROJECTID)
  job.e18 = job.e18 || false

  // Request
  const request = {
    url: config.E18_URL + 'jobs',
    method: 'post',
    headers: {
      'X-API-KEY': config.E18_KEY
    },
    data: job
  }

  // Make the request
  try {
    await axios.request(request)
  } catch (err) {
    await logToDB('error', err)
  }
}

module.exports = {
  activateSubstitutions,
  deactivateSubstitutions,
  logToDB,
  logE18Job
}
