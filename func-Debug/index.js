const { azfHandleResponse, azfHandleError } = require('@vtfk/responsehandlers')

// const { getGroupMembers, getGroupOwners, addGroupOwner, removeGroupOwner } = require('../lib/msgraph')

module.exports = async function (context, req) {
  try {
    // Prepare the request
    // await prepareRequest(req)

    // Connect to dabase
    // await db.connect()

    // Update the school
    // const data = await db.Schools.findByIdAndUpdate(req.params.id, req.body, { new: true })

    // const data = await addTeamsMembership('8df65c9e-a0a4-4599-872c-2d3ba654556b', 'ae34b275-ee14-4ece-b4a0-a03e7dc96313');
    const data = {}
    // data = await getGroupOwners('5735b78c-2f25-40a8-89e2-29c587b1032c')
    // data = await addGroupOwner('5735b78c-2f25-40a8-89e2-29c587b1032c', 'ae34b275-ee14-4ece-b4a0-a03e7dc96313')
    // data = await removeGroupOwner('5735b78c-2f25-40a8-89e2-29c587b1032c', 'ae34b275-ee14-4ece-b4a0-a03e7dc96313')

    // data = await removeGroupOwner('5735b78c-2f25-40a8-89e2-29c587b1032c', 'ae34b275-ee14-4ece-b4a0-a03e7dc96313')
    // data = await getGroupMembers('5735b78c-2f25-40a8-89e2-29c587b1032c')
    // data = await activateSubstitutions('621ca15d9e57b3e8cbe91a35');

    // Send the response
    return await azfHandleResponse(data, context, req)
  } catch (err) {
    return await azfHandleError(err, context, req)
  }
}
