// const commentId = "lakyz0y"; // carnobacterium - fails
const commentId = 'l9yoeju' // Bwana
module.exports = ({ reddit, logger }) => ({
   name: 'distinguishComment',
   //  cronExpression: '3,10,18,25,33,40,48,55 * * * * *', // Every 7.5 seconds
   cronExpression: '0 0 12 1 1 *', // noon 1/1 (Park It)
//    cronExpression: '0 * * * * *', // Every minute (testing)
   // cronExpression: '0 0 23 * * FRI,SAT', // Every Friday and Saturday at 11pm (live)   cronExpression: '0 0 * * * *', // Every hour
   jobFunction: async () => {
      logger.info('Executing distinguish comment job')
      try {
         const result = await reddit.distinguishComment( commentId )
         //   logger.info({
         //      emoji: '👻',
         //      module: 'Sample Job',
         //      feature: 'Get Posts',
         //      message: `Received ${posts.length}`,
         //   })
         console.log(result)
      } catch (error) {
         console.error(
            'distinguishComment: Error distinguishing comment:',
            //  error.response ? error.response.data : error.message
            error.code,
            error.response,
            error.data
         )
      }
   },
})
