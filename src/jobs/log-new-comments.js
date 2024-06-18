module.exports = ({ reddit, logger }) => {
   const loggedCommentIds = new Set()
   // const jobLaunchTime = new Date(); // Store the time the job was instantiated
   const jobLaunchTime = Math.floor(new Date().getTime() / 1000) - 20000 // Convert to UNIX timestamp

   return {
      name: 'logNewComments',
      cronExpression: '0 0 12 1 1 *', // noon 1/1 (Park It)
      // cronExpression: '*/15 * * * * *', // Every 15 seconds
      jobFunction: async () => {
         const subreddit = 'OPLTesting' // Replace with the target subreddit
         logger.info({
            emoji: '💬',
            columns: ['logNewComments', subreddit, `Fetching new comments`],
         })
         try {
            const comments = await reddit.getNewComments(subreddit, 10) // Fetch the latest 10 comments
            // console.log(comments);
            const filteredComments = comments.filter(
               (comment) => comment.data.created_utc > jobLaunchTime
            )
            filteredComments.forEach((comment) => {
               const commentId = comment.data.id
               if (!loggedCommentIds.has(commentId)) {
                  logger.info({
                     emoji: '💬',
                     columns: [
                        'logNewComments',
                        'Found',
                        comment.data.author,
                        comment.data.body,
                     ],
                  })
                  loggedCommentIds.add(commentId) // Mark the comment as logged
               }
            })
         } catch (error) {
            console.error(
               'logNewComments: Error fetching new comments:',
               error.message
            )
         }
      },
   }
}
