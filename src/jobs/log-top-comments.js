const { fetchTopComments } = require('../utils/reddit-utils')

module.exports = ({ reddit, logger }) => ({
   name: 'logTopComments',
   // cronExpression: '0 0 12 1 1 *', // noon 1/1 (Park It)
   cronExpression: '*/30 * * * * *', // Every 30 seconds (testing)
   // cronExpression: '0 0 3 * * SAT,SUN', // Every Saturday and Sunday at 3am (live)
   jobFunction: async () => {
      const subreddit = 'OnPatrolLive' // Replace with the target subreddit
      const searchString = 'title:"Live Thread"' // Search for the exact phrase in the title

      try {
         await fetchTopComments(reddit, logger, subreddit, searchString)
      } catch (error) {
         console.error('Error in scheduled job:', error.message)
      }
   },
})
