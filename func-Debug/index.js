const { azfHandleResponse, azfHandleError } = require('@vtfk/responsehandlers')

const { getGroupMembers, getGroupOwners, addGroupOwner, removeGroupOwner, getOwnedObjects } = require('../lib/msgraph')

const { client, connect, getSDSEntry } = require('../lib/sds')
const { connect:connectDB, Substitutions } = require('../lib/db')

module.exports = async function (context, req) {
  try {
    // Prepare the request
    // await prepareRequest(req)

    // Connect to dabase
    // await db.connect()

    // Update the school
    // const data = await db.Schools.findByIdAndUpdate(req.params.id, req.body, { new: true })

    // const data = await addTeamsMembership('8df65c9e-a0a4-4599-872c-2d3ba654556b', 'ae34b275-ee14-4ece-b4a0-a03e7dc96313');
    let data = {}
    // data = await getGroupOwners('5bf3266e-9ba0-4524-8887-ea6547377b54')
    // data = await addGroupOwner('5735b78c-2f25-40a8-89e2-29c587b1032c', 'ae34b275-ee14-4ece-b4a0-a03e7dc96313')
    // data = await removeGroupOwner('5735b78c-2f25-40a8-89e2-29c587b1032c', 'ae34b275-ee14-4ece-b4a0-a03e7dc96313')

    // data = await removeGroupOwner('5735b78c-2f25-40a8-89e2-29c587b1032c', 'ae34b275-ee14-4ece-b4a0-a03e7dc96313')
    // data = await getGroupMembers('5735b78c-2f25-40a8-89e2-29c587b1032c')
    // data = await activateSubstitutions('621ca15d9e57b3e8cbe91a35');


    // const owned = await getOwnedObjects('gry.heum.thorsen@vtfk.no');
    // const entry = await r.findOne({userPrincipalName: 'gry.heum.thorsen@vtfk.no'})



    const substitutions = [
      {
        "status": "expired",
        "teacherId": "34a4b8ab-316e-46cf-a183-ecf6b170dbea",
        "teacherName": "Bjørn Kaarstein",
        "teacherUpn": "bjorn.kaarstein@vtfk.no",
        "substituteId": "ae34b275-ee14-4ece-b4a0-a03e7dc96313",
        "substituteName": "Gry Heum Thorsen",
        "substituteUpn": "marianne.lundin@vtfk.no",
        "teamId": "5735b78c-2f25-40a8-89e2-29c587b1032c",
        "teamName": "BDK-SDS-TEST-NULL-TO-ENDRET",
        "createdTimestamp": {
            "$date": "2022-04-08T13:21:11.964Z"
        },
        "expirationTimestamp": {
            "$date": "2000-04-09T23:00:00.000Z"
        },
        "updatedTimestamp": {
            "$date": "2022-04-08T13:29:46.273Z"
        },
        "__v": 0
      },
      {
        "status": "expired",
        "teacherId": "34a4b8ab-316e-46cf-a183-ecf6b170dbea",
        "teacherName": "Bjørn Kaarstein",
        "teacherUpn": "bjorn.kaarstein@vtfk.no",
        "substituteId": "ae34b275-ee14-4ece-b4a0-a03e7dc96313",
        "substituteName": "Bente Solberg",
        "substituteUpn": "bente.solberg@vtfk.no",
        "teamId": "5735b78c-2f25-40a8-89e2-29c587b1032c",
        "teamName": "BDK-SDS-TEST-NULL-TO-ENDRET",
        "teamEmail": "Section_2122-OF-GRV-10187250@vtfk.no",
        "createdTimestamp": {
            "$date": "2022-04-08T13:21:11.964Z"
        },
        "expirationTimestamp": {
            "$date": "2000-04-09T23:00:00.000Z"
        },
        "updatedTimestamp": {
            "$date": "2022-04-08T13:29:46.273Z"
        },
        "__v": 0
      }
    ]
    
    /*
      Connect to the SDS Database
    */
    let sdsDBConnected = false;
    try { 
      await connect();
      sdsDBConnected = true;
    } catch (err) {
      console.log('Unable to connect to SDS database', err)
    }

    // Cached SDS entries
    const retreivedSDSRecords = {}
    for(const sub of substitutions) {
      let teamExistsInSDS = false;
      if(sub.teamEmail && sdsDBConnected) {
        // Attempt to retreive the SDS entry from the cache
        let sdsEntry = retreivedSDSRecords[sub.substituteUpn]
        if(!sdsEntry) {
          sdsEntry = await getSDSEntry(sub.substituteUpn)
          retreivedSDSRecords[sub.substituteUpn] = sdsEntry;
        }

        if(sdsEntry?.sds) {
          // Make sure that the SDS key is a array
          if(!Array.isArray(sdsEntry.sds)) sdsEntry.sds = [sdsEntry.sds];
          
          // Retreive all the enrollments
          const enrollments = sdsEntry.sds.map((i) => i.enrollments).flat(3);

          // Determine what to searchfor
          let sectionId = sub.teamEmail;
          if(sectionId.toLowerCase().startsWith('section_')) sectionId = sectionId.substring('section_'.length)
          if(sectionId.includes('@')) sectionId = sectionId.substring(0, sectionId.indexOf('@'))

          // Attempt to find a match
          const match = enrollments.find((i) => i.sectionId === sectionId)
          if(match) teamExistsInSDS = true;  
        }
      }
    }

    // Send the response
    return await azfHandleResponse('', context, req)
  } catch (err) {
    return await azfHandleError(err, context, req)
  }
}
