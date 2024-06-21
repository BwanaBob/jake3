const subreddit = 'OPLTesting' // Replace with the target subreddit

module.exports = ({ reddit, logger }) => ({
   name: 'getModLog',

      cronExpression: '0 0 12 1 1 *', // noon 1/1 (Park It)
   // cronExpression: '*/15 * * * * *', // Every 15 seconds (testing)

   jobFunction: async () => {
      // logger.info({emoji: '💬', columns: ['getModLog', `Starting`, subreddit]});

      try {
         const items = await reddit.getModLog(subreddit, "AutoModerator", "removecomment", 20) // Fetch the latest 20 items
        //  console.log(items)
         const newItems = []

         items.forEach((item) => {
            logger.info({
               emoji: '💬',
               columns: [
                  'getModLog',
                  'Found',
                  item.data.id,
                //   item.data.subreddit,
                  item.data.target_author,
                  item.data.details,
                //   item.data.body,
               ],
            })
            newItems.push(item.data)
         })
         return { status: 'success', data: newItems }
      } catch (error) {
         console.error(
            'getModQueue: Error fetching new comments:',
            error.message
         )
         throw error
      }
   },
})
