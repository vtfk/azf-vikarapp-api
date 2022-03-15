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
const GetSubstitutions = require('../func-GetSubstitutions')
const postSubstitutions = require('../func-PostSubstitution')

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
  test(`non-admin Teacher in 'School #1' should see all teachers except self`, async () => {
    let req = {
      ...request,
      params: { searchTerm: 'test' },
    }
    req.requestor.officeLocation = 'School #1'
    req.requestor.roles = ['']

    const response = await getTeachers(null, req);
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(4);
    expect(response.body[0].displayName).toBeTruthy();
    expect(response.body.map((i) => i.userPrincipalName).includes(req.requestor.upn)).toBe(false);
  })

  test(`non-admin Teacher in 'School #2' should see only from 'School #1' and 'School #2' except self`, async () => {
    let req = {
      ...request,
      params: { searchTerm: 'test' }
    }
    req.requestor.upn = 'tt3@vtfk.no'
    req.requestor.officeLocation = 'School #2'
    req.requestor.roles = ['']

    const response = await getTeachers(null, req);
    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body.includes('School #3')).toBe(false);
    expect(response.body.map((i) => i.userPrincipalName).includes(req.requestor.upn)).toBe(false);
  })

  test(`non-admin Teacher in 'School #3' should only see teachers in 'School #3' except self`, async () => {
    let req = {
      ...request,
      params: { searchTerm: 'test' }
    }
    req.requestor.upn = 'tt4@vtfk.no'
    req.requestor.officeLocation = 'School #3'
    req.requestor.roles = ['']

    const response = await getTeachers(null, req);
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(1);
    expect(!response.body.includes('School #1') && !response.body.includes('School #3')).toBe(true);
    expect(response.body.map((i) => i.userPrincipalName).includes(req.requestor.upn)).toBe(false);
  })

  test(`Admin Teacher in 'School #3' should see all teachers except self`, async () => {
    let req = {
      ...request,
      params: { searchTerm: 'test' }
    }
    req.requestor.upn = 'tt4@vtfk.no'
    req.requestor.roles = ['App.Admin'];
    req.requestor.officeLocation = 'School #3'

    const response = await getTeachers(null, req);
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(4);
    expect(response.body.map((i) => i.userPrincipalName).includes(req.requestor.upn)).toBe(false);
  })

  test(`Teacher in 'School #3 should see self when 'returnSelf=true'`, async () => {
    let req = {
      ...request,
      params: { searchTerm: 'test' },
      query: { returnSelf: true }
    }
    req.requestor.upn = 'tt4@vtfk.no'
    req.requestor.roles = [];
    req.requestor.officeLocation = 'School #3'

    const response = await getTeachers(null, req);
    expect(response.status).toBe(200);
    expect(response.body.map((i) => i.userPrincipalName).includes(req.requestor.upn)).toBe(true);
  })

})

describe('Test GetTeacherTeams', () => {
  test(`School #1 teacher gets teams for other School #1 teacher `, async () => {
    const req = {
      ...request,
      params: { upn: 'tt2@vtfk.no' },
    }
    req.requestor.upn = 'tt1@vtfk.no';
    req.requestor.officeLocation = 'School #1';

    const response = await getTeacherTeams(null, req);
    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0].displayName).toBeTruthy();
  })

  test(`School #2 teacher gets teams for School #1 teacher `, async () => {
    const req = {
      ...request,
      params: { upn: 'tt1@vtfk.no' },
    }
    req.requestor.upn = 'tt3@vtfk.no';
    req.requestor.officeLocation = 'School #2';

    const response = await getTeacherTeams(null, req);
    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0].displayName).toBeTruthy();
  })

  test(`School #3 is not allowed to get School #1 teams`, async () => {
    const req = {
      ...request,
      outputError: false,
      params: { upn: 'tt1@vtfk.no' },
    }
    req.requestor.upn = 'tt4@vtfk.no';
    req.requestor.officeLocation = 'School #3';

    const response = await getTeacherTeams(null, req);
    expect(response.status).toBe(401);
    expect(response.body.message).toBeTruthy();
  })

  test(`Non-SDS teams and expired teams are filtered out`, async () => {
    const req = {
      ...request,
      params: { upn: 'tt1@vtfk.no' },
    }
    req.requestor.upn = 'tt1@vtfk.no';
    req.requestor.officeLocation = 'School #1';

    const response = await getTeacherTeams(null, req);
    expect(response.status).toBe(200);
    for(const team of response.body) {
      expect(team.mail.toLowerCase().startsWith('section_')).toBe(true);
      expect(team.displayName.toLowerCase().startsWith('exp')).toBe(false);
    }
  })
})

describe('Test Substitutions', () => {

  let renewalRequest = undefined;
  let tt2TeamCount = 0;
  test(`Add 'tt1@vtfk.no' as substitute for all 'tt1@vtfk.no' teams`, async () => {
    const upn = 'tt2@vtfk.no';
    let req = { ...request, params: { upn: upn }}
    req.requestor.upn = 'tt1@vtfk.no';
    req.requestor.officeLocation = 'School #1'
    // Retreive the teachers teams
    const teams = await getTeacherTeams(null, req);
    // Prepare the substitute request
    const substituteRequest = teams.body.map((i) => { 
      return { 
        substituteUpn: req.requestor.upn,
        teacherUpn: req.params.upn,
        teamId: i.id
      }
    })
    
    req = {
      ...request,
      body: substituteRequest
    }
    renewalRequest = req;
    tt2TeamCount = teams.body.length;

    const response = await postSubstitutions(null, req)
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(tt2TeamCount)
    for(const substitution of response.body) {
      expect(substitution.substituteUpn).toBe(req.requestor.upn);
      expect(substitution.teacherUpn).toBe(upn);
    }
  })

  test(`Renew the substitution between 'tt1@vtfk.no' and 'tt2@vtfk.no'`, async () => {
    const response = await postSubstitutions(null, renewalRequest)
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(tt2TeamCount);
  })

  test(`Get the substitutions for 'tt1@vtfk.no'`, async () => {
    const req = {
      ...request,
      query: {
        substituteUpn: 'tt1@vtfk.no'
      }
    }
    req.requestor.upn = 'tt1@vtfk.no';
    req.requestor.officeLocation = 'School #1'
    const response = await GetSubstitutions(null, req);
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(tt2TeamCount);
  })
  
  let tt1TeamCount = 0;
  test(`A teacher in 'tt3@vtfk.no' in 'School #2' should be able to substitute from 'School #1'`, async () => {
    let req = { ...request, params: { upn: 'tt1@vtfk.no' }}
    req.requestor.upn = 'tt3@vtfk.no';
    req.requestor.officeLocation = 'School #2'
    const tt1Teams = await getTeacherTeams(null, req);

    tt1TeamCount = tt1Teams.body.length;
    const substituteRequest = tt1Teams.body.map((i) => { 
      return { 
        substituteUpn: req.requestor.upn,
        teacherUpn: req.params.upn,
        teamId: i.id
      }
    })

    req = { ...request, body: substituteRequest }
    const response = await postSubstitutions(null, req);

    expect(response.status).toBe(200);
    expect(response.body.length).toBe(tt1TeamCount);
  })

})

// Clean up after the tests are finished.
afterAll(async () => {
  server.close();
  await disconnect();
})