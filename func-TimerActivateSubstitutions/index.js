const config = require('../config')
const { activateSubstitutions, logToDB } = require('../lib/common')

module.exports = async function (context, myTimer) {
  if (['true', true].includes(config.APP_DEACTIVATE_TIMERS)) return
  try {
    await activateSubstitutions(false, undefined, context)
  } catch (err) {
    context.log('Error activating substitutions', err)
    logToDB('error', err, undefined, context)
  }
}
