const reddit = require('../modules/Reddit') // shared instance
const logger = require('../modules/Logger') // shared instance
// const logger = new Logger()

const config = require('../config')
const { subreddit } = config.jobs.getNewModLog
const { readBehind } = config
const startTime = new Date() - readBehind * 1000 // When the job was first scheduled
let loggedModLogIds = new Set()

const fs = require('fs')
function saveItemsToFile(item) {
   const filePath = 'mod-log.txt'
   fs.appendFile(filePath, JSON.stringify(item, null, 2) + '\n', (err) => {
      if (err) {
         console.error('Error writing to file:', err)
      } else {
         // console.log('Item saved to', filePath)
      }
   })
}

module.exports = () => ({
   name: 'getNewModLog',
   // cronExpression: '0 0 12 1 1 *', // noon 1/1 (Park It)
   //    cronExpression: '*/15 * * * * *', // Every 15 seconds (testing)
   cronExpression: '13,43 * * * * *', // Every 30 seconds (live)

   jobFunction: async () => {
      // logger.info({emoji: '📌', columns: ['getNewPosts', `Fetching`, subreddit]});

      try {
         const logItems = await reddit.getModLog(subreddit, 20) // Fetch the latest 20 items
         const newItems = []

         logItems.forEach((item) => {
            const itemId = item.data.id
            // console.log(item);
            if (
               !loggedModLogIds.has(itemId) &&
               new Date(item.data.created_utc * 1000) >= startTime
            ) {
               logger.info({
                  emoji: '👮',
                  columns: [
                     'New Mod Log',
                     item.data.subreddit,
                     item.data.mod,
                     item.data.action,
                     item.data.details,
                  ],
               })
               newItems.push(item.data)
               loggedModLogIds.add(itemId) // Mark the Item as logged
               saveItemsToFile(item)
            }
         })
         return { status: 'success', data: newItems }
      } catch (error) {
         console.error('getNewModLog: Error fetching new items:', error.message)
         throw error
      }
   },
})
