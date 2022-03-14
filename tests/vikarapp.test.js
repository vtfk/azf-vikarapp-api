/*
  Import dependencies
*/
const { server } = require('../mocks/server');
const { disconnect } = require('../lib/db')
const auth = require('../lib/auth')

/*
  Import data
*/


/*
  Import routes
*/
const getSchools = require('../func-GetSchools')
const postSchools = require('../func-PostShools')
const putSchools = require('../func-PutSchools')
const getTeachers = require('../func-GetTeachers')
const getTeacherTeams = require('../func-GetTeacherTeams');

/*
  Setup
*/
// Environment variables
process.env.AZURE_SEARCH_GROUP_ID = '123'

// Start MSW
beforeAll(() => server.listen())
// Reset MSW after each call (Best practice)
afterEach(() => server.resetHandlers())

/*
  Tests
*/
const headers = {
  Authorization: 'test'
}

describe('Test Schools', () => {
  const request = {
    headers: headers
  }
  test('Post 5 schools', async () => {
    const schools = require('./data/schools')
    for(const school of schools) {
      const response = await postSchools(null, { ...request, body: school })
      expect(response.status).toBe(200);
    }
  })

  let allSchools = []
  test('Get the 5 schools', async () => {
    let response = await getSchools(null, request)
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(5);
    allSchools = response.body;
  })

  test('Give school #1 permissions to all schools', async () => {
    const req = {
      ...request,
      params: { id: allSchools[0]._id },
      body: {
        permittedSchools: allSchools.filter((i,index) => index !== 0).map((i) => i._id.toString())
      }
    }
    let response = await putSchools(null, req)
    expect(response.status).toBe(200);
    expect(response.body.permittedSchools.length).toBe(4);
  })

  test('Give school #2 permissions to School #1', async () => {
    const req = {
      ...request,
      params: { id: allSchools[1]._id },
      body: {
        permittedSchools: [allSchools[0]]
      }
    }
    let response = await putSchools(null, req)
    expect(response.status).toBe(200);
    expect(response.body.permittedSchools.length).toBe(1);
  })
})

describe('Test GetTeachers', () => {
  test('Get teachers', async () => {
    const request = {
      params: { searchTerm: 'test' },
      headers: headers
    }

    const response = await getTeachers(null, request);
    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0].displayName).toBeTruthy();
  })
})

describe('Test GetTeacherTeams endpoint', () => {
  test('Retreive a teacher', async () => {
    const request = {
      params: { upn: 'noen.andre@vtfk.no' },
      headers: headers
    }

    const response = await getTeacherTeams(null, request);
    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0].displayName).toBeTruthy();
  })
})

// Clean up after the tests are finished.
afterAll(async () => {
  server.close();
  await disconnect();
})