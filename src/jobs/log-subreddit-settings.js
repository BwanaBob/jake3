module.exports = ({ reddit, logger }) => ({
   name: 'logSubredditSettings',
   // cronExpression: '*/15 * * * * *', // Every 15 seconds
   cronExpression: '0 10 * * * *', // Every hour
   jobFunction: async () => {
      const subreddit = 'OPLTesting' // Replace with the target subreddit
      logger.info(`Fetching settings for subreddit: ${subreddit}`)
      try {
         const settings = await reddit.getSubredditSettings(subreddit)
         logger.info(`Subreddit settings for /r/${subreddit}:`)
         console.log(settings)
         let mediaTypes = settings.data.comment_contribution_settings
         console.log(mediaTypes)
      } catch (error) {
         logger.info(
            'Error fetching subreddit settings:',
            error.response ? error.response.data : error.message
         )
      }
   },
})
