const reddit = require('../modules/Reddit') // shared instance
const logger = require('../modules/Logger') // shared instance
const config = require('../config')
const { subreddit } = config.jobs.getCotNFlairs

module.exports = () => ({
   name: 'getCotNFlairs',
   cronExpression: '0 0 12 11 1 *', // noon 1/1 (Park It)
   // cronExpression: '0 30 20 * * MON', // pre-showtime (4:30pm cst) - live
   // cronExpression: '*/20 * * * * *', // Every 20 seconds (testing)
   jobFunction: async () => {
      try {
         const allUsersWithFlairs = await reddit.getUsersWithFlairs(subreddit)

         const cotnFlairs = allUsersWithFlairs.filter(
            (user) =>
               user.flair_text &&
               user.flair_text
                  .trim()
                  .toLowerCase()
                  .normalize('NFKD')
                  .includes('cotn')
         )

         logger.info({
            emoji: '📛',
            columns: [
               'CotN Flairs',
               subreddit,
               'Found',
               `${cotnFlairs.length}`,
            ],
         })

         return { status: 'success', subreddit: subreddit, data: cotnFlairs }
      } catch (error) {
         console.error(`Error in getCotNFlairs job: ${error.message}`)
         throw error
      }
   },
})
