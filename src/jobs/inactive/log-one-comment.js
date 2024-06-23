module.exports = ({ reddit, logger }) => ({
   name: 'logOneComment',
   //  cronExpression: '3,10,18,25,33,40,48,55 * * * * *', // Every 7.5 seconds
   // cronExpression: '0 0 12 1 1 *', // noon 1/1 (Park It)
   cronExpression: '*/20 * * * * *', // Every 20 seconds (testing)
   // cronExpression: '0 0 23 * * FRI,SAT', // Every Friday and Saturday at 11pm (live)   cronExpression: '0 0 * * * *', // Every hour
   jobFunction: async () => {
      logger.info('Executing sample job')
    //   try {
        //  const limit = 10 // Specify the number of posts to retrieve
         const comment = await reddit.getOneComment('OnPatrolLive', 'l9uwfgz')
         logger.info({
            emoji: '👻',
            columns: ['One Comment', comment.subreddit, comment.author, comment.body ],
         })
         console.log(comment);
    //   } catch (error) {
    //      console.error(
    //         'Error fetching single comment:',
    //         error.response ? error.response.data : error.message
    //      )
    //   }
   },
})
