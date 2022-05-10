const { azfHandleResponse, azfHandleError } = require('@vtfk/responsehandlers')

const { getGroupMembers, getGroupOwners, addGroupOwner, removeGroupOwner, getOwnedObjects, getUser } = require('../lib/msgraph')

const { client, connect, getSDSEntry } = require('../lib/sds')
const { connect:connectDB, Substitutions } = require('../lib/db')
const { deactivateSubstitutions } = require('../lib/common')

module.exports = async function (context, req) {
  try {
    if(process.env.NODE_ENV === 'production') throw new Error('This endpoint is not active in production')
    // Prepare the request
    // await prepareRequest(req)

    // Connect to dabase
    // await db.connect()

    // Update the school
    // const data = await db.Schools.findByIdAndUpdate(req.params.id, req.body, { new: true })

    // const data = await addTeamsMembership('8df65c9e-a0a4-4599-872c-2d3ba654556b', 'ae34b275-ee14-4ece-b4a0-a03e7dc96313');
    // let data = {}
    // data = await getGroupOwners('5bf3266e-9ba0-4524-8887-ea6547377b54')
    // data = await addGroupOwner('5735b78c-2f25-40a8-89e2-29c587b1032c', 'ae34b275-ee14-4ece-b4a0-a03e7dc96313')
    // data = await removeGroupOwner('5735b78c-2f25-40a8-89e2-29c587b1032c', 'ae34b275-ee14-4ece-b4a0-a03e7dc96313')

    // data = await removeGroupOwner('5735b78c-2f25-40a8-89e2-29c587b1032c', 'ae34b275-ee14-4ece-b4a0-a03e7dc96313')
    // data = await getGroupMembers('5735b78c-2f25-40a8-89e2-29c587b1032c')
    // data = await activateSubstitutions('621ca15d9e57b3e8cbe91a35');


    // const owned = await getOwnedObjects('gry.heum.thorsen@vtfk.no');
    // const entry = await r.findOne({userPrincipalName: 'gry.heum.thorsen@vtfk.no'})

    // let result = await deactivateSubstitutions(false, undefined, req, context);

    // throw new Error('vikarapi-test')

    // Send the response
    return await azfHandleResponse(result, context, req)
  } catch (err) {
    return await azfHandleError(err, context, req)
  }
}
