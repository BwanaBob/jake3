const reddit = require('../modules/Reddit') // shared instance
const logger = require('../modules/Logger') // shared instance
const config = require('../config')
const { subreddit } = config.jobs.getFlairUsage

module.exports = () => ({
   name: 'getFlairUsage',
   cronExpression: '0 0 12 11 1 *', // noon 1/1 (Park It)
   // cronExpression: '0 30 16 * * FRI', // pre-showtime (4:30pm cst) - live
//    cronExpression: '*/30 * * * * *', // Every 30 seconds (testing)

   jobFunction: async () => {
      try {
         // Step 1: Get all flair templates in the subreddit
         const allFlairs = await reddit.getSubredditUserFlairs(subreddit)
         //  console.log(allFlairs)
         // Step 2: Initialize flair usage object and pending users list
         const flairUsageCount = {}
         const pendingUsers = [] // Users without a flair_template_id from comments

         // Initialize flair counts and store css_class for each flair
         allFlairs.forEach((flair) => {
            flairUsageCount[flair.css_class] = {
               count: 0,
               flair_text: flair.text,
               css_class: flair.css_class,
            }
         })

         // Step 3: Get all users with flairs on the subreddit
         const allUsersWithFlairs = await reddit.getUsersWithFlairs(subreddit)
         //  console.log(allUsersWithFlairs)
         // Step 4: Match users' CSS classes to flair templates
         for (const user of allUsersWithFlairs) {
            const userFlairClass = user.flair_css_class

            // If the user has a flair_css_class that matches a template, increment the count
            if (userFlairClass && flairUsageCount[userFlairClass]) {
               flairUsageCount[userFlairClass].count += 1
            } else if (userFlairClass && !flairUsageCount[userFlairClass]) {
               flairUsageCount[userFlairClass] = {
                  count: 1,
                  flair_text: "many",
                  css_class: user.flair_css_class,
               }
            } else {
               if (user.flair_text) {
                  // console.log(user)
                  pendingUsers.push(user.user) // No matching flair, add to pending list
               }
            }
         }

         // Step 5: Identify users without matching flair_css_class after matching
         const usersWithoutFlairTemplateId = pendingUsers

         // Step 6: Sort flair usage counts by count (descending) and flair_text (alphabetically)
         // console.log(flairUsageCount)
         const sortedFlairUsage = Object.values(flairUsageCount).sort(
            (a, b) => {
               if (b.count !== a.count) {
                  return b.count - a.count // Sort by count descending
               }
               return a.css_class.localeCompare(b.css_class) // Sort alphabetically by CSS class
            }
         )

         // Step 7: Log flair usage counts and users without matching flair_css_class
         sortedFlairUsage.forEach((flair) => {
            logger.info({
               emoji: '📛',
               columns: [
                  'Flair Usage',
                  subreddit,
                  flair.css_class,
                  flair.flair_text,
                  `Count: ${flair.count}`,
               ],
            })
         })

         logger.info({
            emoji: '🚨',
            columns: [
               'Missing Flairs',
               subreddit,
               'Users without template',
               usersWithoutFlairTemplateId.join(', '),
            ],
         })
         console.log(usersWithoutFlairTemplateId)
         return {
            status: 'success',
            subreddit: subreddit,
            data: { sortedFlairUsage, usersWithoutFlairTemplateId },
         }
      } catch (error) {
         console.error(`[${new Date().toLocaleString()}] Error in getUnusedFlairs job: ${error.message}`)
         throw error
      }
   },
})
