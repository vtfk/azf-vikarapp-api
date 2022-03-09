/*
  Import dependencies
*/
const { server } = require('../mocks/server');
const auth = require('../lib/auth')

/*
  Import routes
*/
const getTeachers = require('../func-GetTeachers')
const getTeacherTeams = require('../func-GetTeacherTeams');

/*
  Mocking
*/
// jest.spyOn(auth, 'auth').mockImplementation(() => {
//   console.log('!!! Auth has been called!!!!')
// })

/*
  Setup
*/
// Environment variables
process.env.AZURE_SEARCH_GROUP_ID = '123'

// Start MSW
beforeAll(() => server.listen())
// Reset MSW after each call (Best practice)
afterEach(() => server.resetHandlers())
// Clean up after the tests are finished.
afterAll(() => server.close())

/*
  Tests
*/
const headers = {
  Authorization: 'test'
}
// test('Always ok', () =>
// {
// })

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
