/*
  Import dependencies
*/
const { server } = require('../mocks/server');
const { disconnect, Substitutions } = require('../lib/db')
const auth = require('../lib/auth')

/*
  Import data
*/


/*
  Import routes
*/
const getSchools = require('../func-GetSchools')
const postSchools = require('../func-PostSchools')
const putSchools = require('../func-PutSchools')
const getTeachers = require('../func-GetTeachers')
const getTeacherTeams = require('../func-GetTeacherTeams');
const GetSubstitutions = require('../func-GetSubstitutions')
const postSubstitutions = require('../func-PostSubstitution');
const { activateSubstitutions, deactivateSubstitutions } = require('../lib/common');

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
    upn: 's1t1@vtfk.no',
    givenName: 'Test',
    familyName: 'Testesen',
    jobTitle: 'Tester',
    department: 'Test avdelingen',
    company: 'School #1',
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

describe('Teachers', () => {
  test(`non-admin Teacher in 'School #1' should see all teachers except self`, async () => {
    let req = {
      ...request,
      params: { searchTerm: 'test' },
    }
    req.requestor.company = 'School #1'
    req.requestor.roles = ['']

    const response = await getTeachers(null, req);
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(5);
    expect(response.body[0].displayName).toBeTruthy();
    expect(response.body.map((i) => i.userPrincipalName).includes(req.requestor.upn)).toBe(false);
  })

  test(`non-admin Teacher in 'School #2' should see only from 'School #1' and 'School #2' except self`, async () => {
    let req = {
      ...request,
      params: { searchTerm: 'test' }
    }
    req.requestor.upn = 's2t1@vtfk.no'
    req.requestor.company = 'School #2'
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
    req.requestor.upn = 's3t1@vtfk.no'
    req.requestor.company = 'School #3'
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
    req.requestor.upn = 's3t1@vtfk.no'
    req.requestor.roles = ['App.Admin'];
    req.requestor.company = 'School #3'

    const response = await getTeachers(null, req);
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(5);
    expect(response.body.map((i) => i.userPrincipalName).includes(req.requestor.upn)).toBe(false);
  })

  test(`Teacher in 'School #3 should see self when 'returnSelf=true'`, async () => {
    let req = {
      ...request,
      params: { searchTerm: 'test' },
      query: { returnSelf: true }
    }
    req.requestor.upn = 's3t1@vtfk.no'
    req.requestor.roles = [];
    req.requestor.company = 'School #3'

    const response = await getTeachers(null, req);
    expect(response.status).toBe(200);
    expect(response.body.map((i) => i.userPrincipalName).includes(req.requestor.upn)).toBe(true);
  })

})

describe('TeacherTeams', () => {
  test(`School #1 teacher gets teams for other School #1 teacher `, async () => {
    const req = {
      ...request,
      params: { upn: 's1t2@vtfk.no' },
    }
    req.requestor.upn = 's1t1@vtfk.no';
    req.requestor.company = 'School #1';

    const response = await getTeacherTeams(null, req);
    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0].displayName).toBeTruthy();
  })

  test(`School #2 teacher gets teams for School #1 teacher `, async () => {
    const req = {
      ...request,
      params: { upn: 's1t1@vtfk.no' },
    }
    req.requestor.upn = 's2t1@vtfk.no';
    req.requestor.company = 'School #2';

    const response = await getTeacherTeams(null, req);
    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0].displayName).toBeTruthy();
  })

  test(`School #3 is not allowed to get School #1 teams`, async () => {
    const req = {
      ...request,
      outputError: false,
      params: { upn: 's1t1@vtfk.no' },
    }
    req.requestor.upn = 's3t1@vtfk.no';
    req.requestor.company = 'School #3';

    const response = await getTeacherTeams(null, req);
    expect(response.status).toBe(401);
    expect(response.body.message).toBeTruthy();
  })

  test(`Non-SDS teams and expired teams are filtered out`, async () => {
    const req = {
      ...request,
      params: { upn: 's1t1@vtfk.no' },
    }
    req.requestor.upn = 's1t1@vtfk.no';
    req.requestor.company = 'School #1';

    const response = await getTeacherTeams(null, req);
    expect(response.status).toBe(200);
    for(const team of response.body) {
      expect(team.mail.toLowerCase().startsWith('section_')).toBe(true);
      expect(team.displayName.toLowerCase().startsWith('exp')).toBe(false);
    }
  })
})

describe('Substitutions', () => {

  let renewalRequest = undefined;
  let tt2TeamCount = 0;
  test(`Add 's1t1@vtfk.no' as substitute for all 's1t2@vtfk.no' teams`, async () => {
    const upn = 's1t2@vtfk.no';
    let req = { ...request, params: { upn: upn }}
    req.requestor.upn = 's1t1@vtfk.no';
    req.requestor.company = 'School #1'
    // Retreive the teachers teams
    const teams = await getTeacherTeams(null, req);
    // Prepare the substitute request
    const substituteRequest = teams.body.map((i) => { 
      return { 
        substituteUpn: req.requestor.upn,
        teacherUpn: upn,
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

  test(`Renew the substitution between 's1t1@vtfk.no' and 's1t2@vtfk.no'`, async () => {
    const response = await postSubstitutions(null, renewalRequest)
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(tt2TeamCount);
  })

  test(`Get the substitutions for 's1t1@vtfk.no'`, async () => {
    const req = {
      ...request,
      query: {
        substituteUpn: 's1t1@vtfk.no'
      }
    }
    req.requestor.upn = 's1t1@vtfk.no';
    req.requestor.company = 'School #1'
    const response = await GetSubstitutions(null, req);
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(tt2TeamCount);
  })
  
  let tt1TeamCount = 0;
  let tt1Teams = [];
  test(`Teacher in 's2t1@vtfk.no' in 'School #2' should be able to substitute from 's1t1@vtfk.no`, async () => {
    let req = { ...request, params: { upn: 's1t1@vtfk.no' }}
    req.requestor.upn = 's2t1@vtfk.no';
    req.requestor.company = 'School #2'
    const tt1Response = await getTeacherTeams(null, req);

    tt1TeamCount = tt1Response.body.length;
    tt1Teams = tt1Response.body;
    const substituteRequest = tt1Response.body.map((i) => { 
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

  test(`Teacher 's3t1@vtfk.no' in 'School #3' should NOT be able to substitute for 's1t1@vtfk.no`, async () => {
    let req = {
      ...request,
      outputError: false
    }
    req.requestor.upn = 's3t1@vtfk.no';
    req.requestor.company = 'School #3'
    req.requestor.roles = [''];

    req.body = tt1Teams.map((i) => { 
      return { 
        substituteUpn: 's3t1@vtfk.no',
        teacherUpn: 's1t1@vtfk.no',
        teamId: i.id
      }
    })

    const response = await postSubstitutions(null, req);
    expect(response.status).toBe(401);
    expect(response.body.message).toBeTruthy();
  })

  test(`Admin 's3t2@vtfk.no' should be able to make 's3t1@vtfk.no' substitute for 's1t1@vtfk.no'`, async () => {
    let req = {
      ...request,
      requestor: {
        ...request.requestor,
        upn: 's3t2@vtfk.no',
        company: 'School #3',
        roles: ['App.Admin']
      }
    }

    req.body = tt1Teams.map((i) => { 
      return { 
        substituteUpn: 's3t1@vtfk.no',
        teacherUpn: 's1t1@vtfk.no',
        teamId: i.id
      }
    })

    const response = await postSubstitutions(null, req);
    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(1);
  })

  test(`Admin 's3t2@vtfk.no' should be able to GET all substitutions`, async () => {
    let req = {
      ...request,
      requestor: {
        ...request.requestor,
        upn: 's3t2@vtfk.no',
        company: 'School #3',
        roles: ['App.Admin']
      }
    }

    const response = await GetSubstitutions(null, req);
    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThanOrEqual(5);
  })

  test(`Query 'substituteUpn=s1t1@vtfk.no' should yeild only 's1t1@vtfk.no' as substitute in the results`, async () => {
    let req = {
      ...request,
      query: {
        substituteUpn: 's1t1@vtfk.no'
      },
      requestor: {
        ...request.requestor,
        upn: 's3t2@vtfk.no',
        company: 'School #3',
        roles: ['App.Admin']
      }
    }

    const response = await GetSubstitutions(null, req);
    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body.filter((i) => i.substituteUpn !== 's1t1@vtfk.no').length).toBe(0);
  })

  test(`Query 'teacherUpn=s1t1@vtfk.no' should yeild only 's1t1@vtfk.no' as teacher in the results`, async () => {
    let req = {
      ...request,
      query: {
        teacherUpn: 's1t1@vtfk.no'
      },
      requestor: {
        ...request.requestor,
        upn: 's3t2@vtfk.no',
        company: 'School #3',
        roles: ['App.Admin']
      }
    }

    const response = await GetSubstitutions(null, req);
    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body.filter((i) => i.teacherUpn !== 's1t1@vtfk.no').length).toBe(0);
  })

  test(`non-admin user 's3t1@vtfk.no' should NOT be able to GET all substitutions`, async () => {
    let req = {
      ...request,
      outputError: false,
      requestor: {
        ...request.requestor,
        upn: 's3t1@vtfk.no',
        company: 'School #3',
        roles: ['']
      }
    }

    const response = await GetSubstitutions(null, req);
    expect(response.status).toBe(401);
    expect(response.body.message).toBeTruthy();
  })

  test(`non-admin user 's3t1@vtfk.no' should NOT be able to get 's1t1@vtfk.no' substitutions`, async () => {
    let req = {
      ...request,
      outputError: false,
      query: {
        substituteUpn: 's1t1@vtfk.no'
      },
      requestor: {
        ...request.requestor,
        upn: 's3t1@vtfk.no',
        company: 'School #3',
        roles: ['']
      }
    }

    const response = await GetSubstitutions(null, req);
    expect(response.status).toBe(401);
    expect(response.body.message).toBeTruthy();
  })

  test(`non-admin user 's3t1@vtfk.no' should NOT be able to get where 's1t1@vtfk.no' was teacher`, async () => {
    let req = {
      ...request,
      outputError: false,
      query: {
        teacherUpn: 's1t1@vtfk.no'
      },
      requestor: {
        ...request.requestor,
        upn: 's3t1@vtfk.no',
        company: 'School #3',
        roles: ['']
      }
    }

    const response = await GetSubstitutions(null, req);
    expect(response.status).toBe(401);
    expect(response.body.message).toBeTruthy();
  })

  test(`non-admin user 's3t1@vtfk.no' SHOULD be able to get where self was substitute`, async () => {
    let req = {
      ...request,
      outputError: false,
      query: {
        substituteUpn: 's3t1@vtfk.no'
      },
      requestor: {
        ...request.requestor,
        upn: 's3t1@vtfk.no',
        company: 'School #3',
        roles: ['']
      }
    }

    const response = await GetSubstitutions(null, req);
    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
  })

  test(`non-admin user 's1t2@vtfk.no' SHOULD be able to get where self was teacher`, async () => {
    let req = {
      ...request,
      query: {
        teacherUpn: 's1t2@vtfk.no'
      },
      requestor: {
        ...request.requestor,
        upn: 's1t2@vtfk.no',
        company: 'School #1',
        roles: ['']
      }
    }

    const response = await GetSubstitutions(null, req);
    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
  })
})

// describe('Activate substitutions', () => {
//   let substitutions = [];
//   test(('Retreiving all pending substitutions'), async () => {
//     substitutions = await Substitutions.find({ status: 'pending' });
//   })

//   test(('Activating the first substitution'), async () => {
//     const response = await activateSubstitutions(true);
//     expect(response.length).toBe(1);
//     expect(response[0]._id).not.toBe(undefined);
//     expect(response[0].status).toBe('active');
//   })

//   test(`Verify that there is one less pending substitution`, async () => {
//     let pendingBefore = substitutions.length;
//     let now = await Substitutions.find({ status: 'pending' });
//     expect(now.length + 1).toBe(pendingBefore);
//   })

//   test(('Activate the rest of the substitutions'), async () => {
//     const response = await activateSubstitutions();
//     expect(response.length).toBeGreaterThan(0);
//     expect(response[0]._id).not.toBe(undefined);
//     expect(response[0].status).toBe('active');
//   })

//   test(`Verify that there are 0 pending substitutions`, async () => {
//     let subs = await Substitutions.find({ status: 'pending' });
//     expect(subs.length).toBe(0);
//   })
// })

describe('Deactivate/expire substitutions', () => {
  test('Set expirationTimestamp to yesterday for all substitutions', async () => {
    var yesterday = new Date().setDate(new Date().getDate() - 1);
    const response = await Substitutions.updateMany({}, { expirationTimestamp: yesterday}, { new: true });

    expect(response).toBeTruthy();
    expect(response.modifiedCount).toBeGreaterThan(0);

    const all = await Substitutions.find({ expirationTimestamp: yesterday });
    expect(all.length).toBe(response.modifiedCount);
  })

  test('Deactivate the first substitution', async () => {
    const response = await deactivateSubstitutions(true);
    expect(response).toBeTruthy();
    expect(response.length).toBe(1);
    expect(response[0].status).toBe('expired');
  })

  test('Verify that there is one expired substitution', async () => {
    const response = await Substitutions.find({ status: 'expired' })
    expect(response).toBeTruthy();
    expect(response.length).toBe(1);
    expect(response[0].status).toBe('expired');
  })

  test('Deactivate the rest of the substitutions', async () => {
    const response = await deactivateSubstitutions();
    expect(response).toBeTruthy();
    expect(response.length).toBeGreaterThan(1);

    const notExpired = response.filter((i) => i.status !== 'expired');
    expect(notExpired.length).toBe(0)
  })
})

// Clean up after the tests are finished.
afterAll(async () => {
  server.close();
  await disconnect();
})