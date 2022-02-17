const { default: axios } = require('axios');
const { getToken } = require('./appauth')

async function callMSGraph(request) {
  // Get token
  const token =  await getToken();

  // Add authorization to the token
  request.headers.Authorization = token;

  // Make the request
  const { data } = await axios.request(request);

  // Return
  return data;
}

module.exports = {
  callMSGraph
}