const { readBehind } = require('../config')

let loggedItemIds = new Set()
const startTime = new Date() - readBehind * 1000 // When the job was first scheduled
// const subreddit = 'OnPatrolLive,OPLTesting' // Replace with the target subreddit
const subreddit = 'OPLTesting+OnPatrolLive+Police247' // Replace with the target subreddit

const fs = require('fs')
function saveItemsToFile(item) {
   const filePath = 'queue-items.txt'
   fs.appendFile(filePath, JSON.stringify(item, null, 2) + '\n', (err) => {
      if (err) {
         console.error('Error writing to file:', err)
      } else {
         console.log('Items saved to', filePath)
      }
   })
}

module.exports = ({ reddit, logger }) => ({
   name: 'getNewModQueue',

   // cronExpression: '0 0 12 1 1 *', // noon 1/1 (Park It)
   // cronExpression: '*/15 * * * * *', // Every 15 seconds (testing)
   cronExpression: '4,19,34,49 * * * * *', // Every 15 seconds (live)

   jobFunction: async () => {
      // logger.info({emoji: '💬', columns: ['getNewModQueue', `Fetching`, subreddit]});
      try {
         const queuedItems = await reddit.getNewModQueue(subreddit, 10) // Fetch the latest 10 comments
         const newItems = []
         // console.log(queuedItems)
         queuedItems.forEach((item) => {
            const itemId = item.data.id
            if (
               !loggedItemIds.has(itemId) &&
               new Date(item.data.created_utc * 1000) >= startTime
            ) {
               // console.log(item)
               logger.info({
                  emoji: '💬',
                  columns: [
                     'New ModQueue',
                     item.data.subreddit,
                     item.kind,
                     item.data.author,
                     item.data.id,
                     // description,
                  ],
               })
               newItems.push(item)
               loggedItemIds.add(itemId) // Mark the comment as logged
               saveItemsToFile(item)
            }
         })
         return { status: 'success', data: newItems }
      } catch (error) {
         console.error(
            'getNewModQueue: Error fetching new comments:',
            // error.message
            error
         )
         throw error
      }
   },
})
