/*
  Import dependencies
*/
const { server } = require('../mocks/server');

/*
  Setup
*/
// Start MSW
beforeAll(() => server.listen())
// Reset MSW after each call (Best practice)
afterEach(() => server.resetHandlers())

/*
  Tests
*/

/*
  Finalize / Cleanup
*/
// Clean up after the tests are finished.
afterAll(() => server.close())
