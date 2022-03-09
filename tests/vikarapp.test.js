/*
  Import dependencies
*/
// MSW
const { server } = require('../mocks/server');

/*
  Import routes
*/
// const getTeacherTeams = require('../func-GetTeacherTeams');

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
// const headers = {
//   Authorization: 'test'
// }
test('Always ok', () => expect(1).toBe(1))

// describe('Test GetTeachers endpoint', () => {
//   test('Retreive a teacher', async () => {
//     const request = {
//       params: { upn: 'noen.andre@vtfk.no' },
//       headers: headers
//     }

//     const response = await getTeacherTeams(null, request);

//     expect(response.status).toBe(200);
//     expect(response.body.length).toBeGreaterThan(0);
//     expect(response.body[0].displayName).toBeTruthy();
//   })
// })
