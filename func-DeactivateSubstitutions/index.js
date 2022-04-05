const { azfHandleResponse, azfHandleError } = require('@vtfk/responsehandlers')
const { deactivateSubstitutions, logToDB } = require('../lib/common')
const db = require('../lib/db')
const { prepareRequest } = require('../lib/_helpers')

module.exports = async function (context, req) {
  let requestor
  try {
    // Prepare the request
    ({ requestor } = await prepareRequest(req, { required: ['body'] }))

    // Make sure that the requestor is admin
    if (!requestor.roles?.includes('App.Config')) throw new Error('You do not have the required permissions to deactivate a substitution')

    if (!Array.isArray(req.body)) throw new Error('The body must be an array')
    req.body.forEach((i) => { if (typeof i !== 'string') throw new Error(`The id '${i}' is not of type 'string'`) })

    // Retreive all ids from the body
    const ids = req.body.filter((i) => i)
    if (ids.length === 0) throw new Error('The body does not contain a valid array if ids')

    // Connect to dabase
    await db.connect()

    // Update the school
    const response = await db.Substitutions.find({ _id: { $in: ids } })

    // Deactivate all expired
    await deactivateSubstitutions(undefined, response)

    // Write the request to the database
    logToDB('info', 'OK', req, context, requestor)

    // Send the response
    return await azfHandleResponse(response, context, req)
  } catch (err) {
    await logToDB('error', err, req, context, requestor)
    return await azfHandleError(err, context, req)
  }
}
