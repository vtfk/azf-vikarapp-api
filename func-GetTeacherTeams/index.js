const { azfHandleResponse, azfHandleError } = require('@vtfk/responsehandlers')
const { prepareRequest } = require('../lib/_helpers')
const { getUser, getOwnedObjects } = require('../lib/msgraph')
const { getPermittedLocations } = require('../lib/getPermittedLocations')
const HTTPError = require('../lib/httperror')

module.exports = async function (context, req) {
  try {
    // Prepare the request
    const required = ['params.upn']
    const { requestor } = await prepareRequest(req, { required })

    // If the user is not admin, make sure that the user has permissing to see the users teams
    if (!requestor.roles.includes('App.Admin')) {
      // Get the user to get teams from
      const user = await getUser(req.params.upn)
      if (!user) throw new Error(`Kunne ikke finne en bruker med upn '${req.params.upn}'`)

      // Get the requestors permitted locations
      const permittedLocations = await getPermittedLocations(requestor.officeLocation)
      const permittedNames = permittedLocations.map((i) => i.name)

      // Throw if the user is not in the permitted locations
      if (!permittedNames.includes(user.officeLocation)) throw new HTTPError(401, `Du har ikke lov til å se teams for lokasjon '${user.officeLocation}'`, 'Manglende rettigheter')
    }

    // Retreive the owned objects
    let data = await getOwnedObjects(req.params.upn)

    // Filter out any resources that is not an SDS team
    data = data.filter((i) => i.mail && i.mail.toLowerCase().startsWith('section_'))
    // Filter out any resources that are expired
    data = data.filter((i) => !i.displayName.toLowerCase().startsWith('exp'))

    // Send the response
    return await azfHandleResponse(data, context, req)
  } catch (err) {
    return await azfHandleError(err, context, req)
  }
}
