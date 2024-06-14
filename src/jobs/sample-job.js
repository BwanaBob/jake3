module.exports = ({ reddit, logger }) => ({
   name: 'sampleJob',
  //  cronExpression: '3,10,18,25,33,40,48,55 * * * * *', // Every 7.5 seconds
   cronExpression: '0 0 * * * *', // Every hour
   jobFunction: async () => {
      logger.info('Executing sample job')
      try {
         const limit = 10 // Specify the number of posts to retrieve
         const posts = await reddit.getSubredditPosts('OPLTesting', limit)
         logger.info({
            emoji: '👻',
            module: 'Sample Job',
            feature: 'Get Posts',
            message: `Received ${posts.length}`,
         })
         console.log(posts);
      } catch (error) {
         logger.info(
            'Error fetching Reddit posts:',
            error.response ? error.response.data : error.message
         )
      }
   },
})
