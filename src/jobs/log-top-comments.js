const { fetchTopComments } = require('../utils/reddit-utils')

module.exports = ({ reddit, logger }) => ({
   name: 'logTopComments',
   cronExpression: '0 10 * * * *', // Every hour
   // cronExpression: '*/25 * * * * *', // Every 15 seconds
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
