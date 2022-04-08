const config = require('../config')
const { deactivateSubstitutions, logToDB } = require('../lib/common')

module.exports = async function (context, myTimer) {
  if (['true', true].includes(config.APP_DEACTIVATE_TIMERS)) return
  try {
    await deactivateSubstitutions(false, undefined, undefined, context)
  } catch (err) {
    logToDB('error', err, undefined, context)
  }
}
