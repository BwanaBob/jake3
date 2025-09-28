const { decode } = require('html-entities')
const reddit = require('../modules/Reddit') // shared instance
const logger = require('../modules/Logger') // shared instance
const config = require('../config')
const { subreddit } = config.jobs.getNewModQueue
const { readBehind } = config

let loggedItemIds = new Set()
const startTime = new Date() - readBehind * 1000 // When the job was first scheduled

const fs = require('fs')
const path = require('path')
function saveItemsToFile(item) {
   const dirPath = 'logs'
   const filePath = path.join(dirPath, 'queue-items.txt')
   if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
   }
   fs.appendFile(filePath, JSON.stringify(item, null, 2) + '\n', (err) => {
      if (err) {
         console.error(`[${new Date().toLocaleString()}] Error writing to file:`, err)
      } else {
         // console.log('Item saved to', filePath)
      }
   })
}

module.exports = () => ({
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
               // decode fields
               if (item.data.title) {
                  item.data.title = decode(item.data.title)
               }
               if (item.data.body) {
                  item.data.body = decode(item.data.body)
               }
               // console.log(item)
               let kindText = 'Queue Item'
               let descriptionText = '<unknown>'

               if (item.kind == 't1') {
                  kindText = 'Queue Comment'
                  descriptionText = item.data.body || '<No Body>'
               } else if (item.kind == 't3') {
                  kindText = 'Queue Post'
                  descriptionText = item.data.title || '<No Title>'
               }

               logger.info({
                  emoji: '🛑',
                  columns: [
                     kindText,
                     item.data.subreddit,
                     item.data.author,
                     descriptionText,
                     // item.data.id,
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
            `[${new Date().toLocaleString()}] [getNewModQueue] Error fetching new comments:`,
            // error.message
            error.response ? error.response.data : error.message
            // error
         )
         throw error
      }
   },
})
