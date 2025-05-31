const reddit = require('../modules/Reddit') // shared instance
const logger = require('../modules/Logger') // shared instance
const config = require('../config')
const { subreddit } = config.jobs.getUnusedFlairs

module.exports = () => ({
   name: 'getUnusedFlairs',
   cronExpression: '0 0 12 11 1 *', // noon 1/1 (Park It)
   // cronExpression: '0 30 16 * * FRI', // pre-showtime (4:30pm cst) - live
   // cronExpression: '*/15 * * * * *', // Every 15 seconds (testing)
   jobFunction: async () => {
      try {
         const allFlairs = await reddit.getSubredditUserFlairs(subreddit)
         //  console.log(allFlairs[0])
         const allUsersWithFlairs = await reddit.getUsersWithFlairs(subreddit)
         //  console.log(allUsersWithFlairs[0])

         // Step 3: Compare and filter unused flairs
         const unusedFlairs = allFlairs.filter(
            (template) =>
               !allUsersWithFlairs.some(
                  (userFlair) =>
                     //  userFlair.flair_css_class === template.flair_css_class &&
                     userFlair.flair_text === template.text
               )
         )

         //  console.log(
         //     `Unused flairs: ${unusedFlairs.map((f) => f.text).join(', ')}`
         //  )

         logger.info({
            emoji: '📛',
            columns: ['UnusedFlair', subreddit, 'Found', `${unusedFlairs.length}`],
         })

         return { status: 'success', data: unusedFlairs }

         // return true;
      } catch (error) {
         console.error(`[${new Date().toLocaleString()}] Error in getUnusedFlairs job: ${error.message}`)
         throw error
      }
   },
})
