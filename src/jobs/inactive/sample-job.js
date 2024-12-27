module.exports = ({ reddit, logger }) => ({
   name: 'sampleJob',
  //  cronExpression: '3,10,18,25,33,40,48,55 * * * * *', // Every 7.5 seconds
   cronExpression: '0 0 12 11 1 *', // noon 1/1 (Park It)
   // cronExpression: '*/20 * * * * *', // Every 20 seconds (testing)
   // cronExpression: '0 0 23 * * FRI,SAT', // Every Friday and Saturday at 11pm (live)   cronExpression: '0 0 * * * *', // Every hour
   jobFunction: async () => {
      logger.info('Executing sample job')
      try {
         const limit = 10 // Specify the number of posts to retrieve
         const posts = await reddit.getSubredditPosts('OnPatrolLive', limit)
         logger.info({
            emoji: '👻',
            module: 'Sample Job',
            feature: 'Get Posts',
            message: `Received ${posts.length}`,
         })
         // console.log(posts);
      } catch (error) {
         logger.info(
            'Error fetching Reddit posts:',
            error.response ? error.response.data : error.message
         )
      }
   },
})
