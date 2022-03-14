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
const request = {
  headers: {
    Authorization: 'test'
  },
  requestor: {
    id: '123',
    sid: '123',
    ipaddress: '8.8.4.4',
    name: 'Test Testesen I',
    upn: 'tt1@vtfk.no',
    givenName: 'Test',
    familyName: 'Testesen',
    jobTitle: 'Tester',
    department: 'Test avdelingen',
    officeLocation: 'School #1',
    roles: ['App.Admin', 'App.Config'],
    scopes: ['123']
  }
}

describe('Test Schools', () => {
  test('Post 3 schools', async () => {
    const schools = require('./data/schools')
    for(const school of schools) {
      const response = await postSchools(null, { ...request, body: school })
      expect(response.status).toBe(200);
    }
  })

  let allSchools = []
  test('Get all schools', async () => {
    let response = await getSchools(null, request)
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(3);
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
    expect(response.body.permittedSchools.length).toBe(2);
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

  test(`Rename 'School #test' to School #3`, async () => {
    const req = {
      ...request,
      params: { id: allSchools[2]._id },
      body: {
        name: 'School #3'
      }
    }
    let response = await putSchools(null, req)
    expect(response.status).toBe(200);
    expect(response.body.name).toBe('School #3');
  })
})

describe('Test GetTeachers', () => {
  test('non-admin Teacher in School #1 should see all 5 teachers', async () => {
    let req = {
      ...request,
      params: { searchTerm: 'test' },
    }
    req.requestor.officeLocation = 'School #1'
    req.requestor.roles = ['']

    const response = await getTeachers(null, req);
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(5);
    expect(response.body[0].displayName).toBeTruthy();
  })

  test(`non-admin Teacher in 'School #2' should see only from 'School #1' and 'School #2'`, async () => {
    let req = {
      ...request,
      params: { searchTerm: 'test' }
    }
    req.requestor.officeLocation = 'School #2'
    req.requestor.roles = ['']

    const response = await getTeachers(null, req);
    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body.includes('School #3')).toBe(false);
  })

  test(`non-admin Teacher in 'School #3' should only see teachers in 'School #3'`, async () => {
    let req = {
      ...request,
      params: { searchTerm: 'test' }
    }
    req.requestor.officeLocation = 'School #3'
    req.requestor.roles = ['']

    const response = await getTeachers(null, req);
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(2);
    expect(!response.body.includes('School #1') && !response.body.includes('School #3')).toBe(true);
  })

  test(`Admin Teacher in 'School #3' should see all teachers`, async () => {
    let req = {
      ...request,
      params: { searchTerm: 'test' }
    }
    req.requestor.roles = ['App.Admin'];
    req.requestor.officeLocation = 'School #3'

    const response = await getTeachers(null, req);
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(5);
  })

})

describe('Test GetTeacherTeams', () => {
  test('Retreive a teacher', async () => {
    const req = {
      ...request,
      params: { upn: 'noen.andre@vtfk.no' },
    }

    const response = await getTeacherTeams(null, req);
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