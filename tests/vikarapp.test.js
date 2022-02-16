/*
  Import dependencies
*/
// MSW
const { server } = require('../mocks/server');

/*
  Import routes
*/
const GetTeachers = require('../GetTeachers');

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

    const response = await GetTeachers(null, request);

    expect(response.length).toBe(1);
    expect(response[0].name).toBeTruthy();
  })
})
