const { azfHandleResponse, azfHandleError } = require('@vtfk/responsehandlers')
const { logToDB } = require('../lib/common')
const db = require('../lib/db')
const HTTPError = require('../lib/httperror')

const { prepareRequest } = require('../lib/_helpers')

module.exports = async function (context, req) {
  let requestor

  try {
    // Prepare the request
    ({ requestor } = await prepareRequest(req))

    // Connect to dabase
    await db.connect()

    // Retreive query parameters
    const status = req.query?.status
    const substituteUpn = req.query?.substituteUpn
    const teacherUpn = req.query?.teacherUpn
    let years = req.query?.years
    if (years && years.includes(',')) years = years.split(',')
    if (years && !Array.isArray(years)) years = [years]

    // If the requestor is not admin, make sure that it has permissions for the call
    if (!requestor.roles.includes('App.Admin')) {
      if (!substituteUpn && !teacherUpn) throw new HTTPError(401, 'Du har ikke rettigheter til å søke etter alle vikarieter', 'Manglende rettigheter')
      if (substituteUpn !== requestor.upn && teacherUpn !== requestor.upn) throw new HTTPError(401, 'Du har ikke rettigheter til å søke vikariat hvor du selv ikke er lærer eller vikar', 'Manglende rettigheter')
    }

    // Define the filter
    let filter = []
    if (status) { filter.push({ status: status }) }
    if (substituteUpn) { filter.push({ substituteUpn: substituteUpn }) }
    if (teacherUpn) { filter.push({ teacherUpn: teacherUpn }) }
    if (years && years.length > 0) {
      const $or = []

      years.forEach((i) => {
        const firstTimestamp = new Date(i, 0, 1, 1)
        const lastTimestamp = new Date(i, 12, 31, 25)
        $or.push({
          createdTimestamp: {
            $gt: firstTimestamp,
            $lt: lastTimestamp
          }
        })
      })
      filter.push({ $or: $or })
    }

    if (filter.length > 0) filter = { $and: [...filter] }
    else filter = {}

    // Make the database request
    const data = await db.Substitutions.find(filter).sort({ expirationTimestamp: 'desc' })

    // Send the response
    return await azfHandleResponse(data, context, req)
  } catch (err) {
    logToDB('error', err, req, context, requestor)
    return await azfHandleError(err, context, req)
  }
}
