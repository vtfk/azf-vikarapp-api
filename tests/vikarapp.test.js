/*
  Import dependencies
*/
// MSW
const { server } = require('../mocks/server');

/*
  Import routes
*/
const getTeacherTeams = require('../GetTeacherTeams');

/*
  Setup
*/
// Start MSW
beforeAll(() => server.listen())
// Reset MSW after each call (Best practice)
afterEach(() => server.resetHandlers())
// Clean up after the tests are finished.
afterAll(() => server.close())

/*
  Tests
*/
describe('Test GetTeachers endpoint', () => {
  test('Retreive a teacher', async () => {
    const request = {
      params: { upn: 'noen.andre@vtfk.no' }
    }

    const response = await getTeacherTeams(null, request);

    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0].displayName).toBeTruthy();
  })
})
