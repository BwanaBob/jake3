let loggedCommentIds = new Set()
const startTime = new Date() // When the job was first scheduled
const subreddit = 'OPLTesting+OnPatrolLive' // Replace with the target subreddit

module.exports = ({ reddit, logger }) => ({
   name: 'getNewComments',

   cronExpression: '0 0 12 1 1 *', // noon 1/1 (Park It)
   // cronExpression: '*/15 * * * * *', // Every 15 seconds (live and testing)

   jobFunction: async () => {
      // logger.info({emoji: '💬', columns: ['getNewComments', `Fetching`, subreddit]});

      try {
         const comments = await reddit.getNewComments(subreddit, 20) // Fetch the latest 20 comments
         const newComments = []

         comments.forEach((comment) => {
            const commentId = comment.data.id
            if (
               !loggedCommentIds.has(commentId) &&
               new Date(comment.data.created_utc * 1000) >= startTime
            ) {
               logger.info({
                  emoji: '💬',
                  columns: [
                     'getNewComments',
                     'Found',
                     comment.data.subreddit,
                     comment.data.author,
                     comment.data.body,
                  ],
               })
               newComments.push(comment.data)
               loggedCommentIds.add(commentId) // Mark the comment as logged
            }
         })
         return { status: 'success', data: newComments }
      } catch (error) {
         console.error(
            'getNewComments: Error fetching new comments:',
            error.message
         )
         throw error
      }
   },
})
