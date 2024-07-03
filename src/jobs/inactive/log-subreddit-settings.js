module.exports = ({ reddit, logger }) => ({
   name: 'logSubredditSettings',
   cronExpression: '0 0 12 1 1 *', // noon 1/1 (Park It)
   // cronExpression: '*/20 * * * * *', // Every 20 seconds (testing)
   // cronExpression: '0 0 23 * * FRI,SAT', // Every Friday and Saturday at 11pm (live)
   jobFunction: async () => {
      const subreddit = 'OnPatrolLive' // Replace with the target subreddit
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
