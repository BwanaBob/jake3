let loggedItemIds = new Set()
const startTime = new Date() // When the job was first scheduled
const subreddit = 'OPLTesting' // Replace with the target subreddit

module.exports = ({ reddit, logger }) => ({
   name: 'getNewModQueue',

//    cronExpression: '0 0 12 1 1 *', // noon 1/1 (Park It)
   cronExpression: '*/15 * * * * *', // Every 15 seconds (live and testing)

   jobFunction: async () => {
      // logger.info({emoji: '💬', columns: ['getNewModQueue', `Fetching`, subreddit]});

      try {
         const queuedItems = await reddit.getNewModQueue(subreddit, 10) // Fetch the latest 10 comments
         const newItems = []
console.log(queuedItems)
         queuedItems.forEach((item) => {
            const itemId = item.data.id
            if (
               !loggedItemIds.has(itemId) &&
               new Date(item.data.created_utc * 1000) >= startTime
            ) {
               // if (!loggedCommentIds.has(commentId) ) {
               logger.info({
                  emoji: '💬',
                  columns: [
                     'getNewModQueue',
                     'Found',
                     item.data.subreddit,
                     item.data.id,
                  ],
               })
               newItems.push(item.data)
               loggedItemIds.add(itemId) // Mark the comment as logged
            }
         })
         return { status: 'success', data: newItems }
      } catch (error) {
         console.error(
            'getNewModQueue: Error fetching new comments:',
            error.message
         )
         throw error
      }
   },
})
