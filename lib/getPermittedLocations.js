const { connect, Schools } = require('./db')
const HTTPError = require('./httperror')

async function getPermittedLocations (company) {
  // Check if we need to filter out some results
  const permittedLocations = []
  // Connect the database and retreive the requestors school
  await connect()
  const school = await Schools.findOne({ name: company }).populate('permittedSchools', '_id name').lean()

  // Validate that the school exists
  if (!school) throw new HTTPError(404, `Kunne ikke finne skole ${company} og kan derfor ikke gjennomføre søket`)

  // Add the users own school
  if (school._id && school.name) permittedLocations.push({ _id: school._id, name: school.name })

  // Add any other permitted schools
  if (school.permittedSchools && Array.isArray(school.permittedSchools)) {
    for (const location of school.permittedSchools) {
      if (location._id && location.name) permittedLocations.push({ _id: location._id, name: location.name })
    }
  }

  return permittedLocations
}

module.exports = {
  getPermittedLocations
}
