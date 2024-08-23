const reddit = require('../modules/Reddit') // shared instance
const logger = require('../modules/Logger') // shared instance
const config = require('../config')
const { subreddit } = config.jobs.getTempBans

module.exports = () => ({
   name: 'getTempBans',
   cronExpression: '0 30 17 * * FRI,SAT', // pre-showtime (5:30pm cst) - live
   // cronExpression: '*/15 * * * * *', // Every 15 seconds (testing)
   jobFunction: async () => {
      try {
         const banData = await reddit.getTempBans(subreddit) // Fetch the bans
         const bans = banData
            .filter((ban) => ban.days_left !== null)
            .map((ban) => ({
               name: ban.name,
               days_left: ban.days_left,
               note: ban.note,
               date: ban.date,
               //    date: new Date(ban.date * 1000).toISOString(),
               id: ban.id,
            }))
         logger.info({
            emoji: '🔨',
            columns: ['TempBans', 'Found', `${bans.length}`],
         })
         return { status: 'success', data: bans }
      } catch (error) {
         console.error(`Failed to retrieve temporary bans: ${error.message}`)
         throw error
      }
   },
})
