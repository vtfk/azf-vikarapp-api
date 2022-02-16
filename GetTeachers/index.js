const { azfHandleResponse, azfHandleError } = require('@vtfk/responsehandlers')
const { DefaultAzureCredential, VisualStudioCodeCredential, AzureCliCredential, useIdentityPlugin } = require('@azure/identity')

module.exports = async function (context, req) {
  try {
    if (!req.params.upn) throw new Error('No UPN was provided')
    // const creds = new DefaultAzureCredential();
    const vscodeCreds = new AzureCliCredential();


    const token = await vscodeCreds.getToken(['User.Read']);

    console.log(token);


    const data = [
      {
        name: 'Trude Ellerei'
      }
    ]

    return await azfHandleResponse(data, context, req)
  } catch (err) {
    return await azfHandleError(err, context, req)
  }
}
