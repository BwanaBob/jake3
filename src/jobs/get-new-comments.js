const { decode } = require('html-entities')
const reddit = require('../modules/Reddit') // shared instance
const logger = require('../modules/Logger') // shared instance
// const logger = new Logger()

const config = require('../config')
const { subreddit } = config.jobs.getNewComments
const { readBehind } = config
const startTime = new Date() - (readBehind * 1000)// When the job was first scheduled

let loggedCommentIds = new Set()
const fs = require('fs')
const path = require('path')

function saveItemsToFile(item) {
   const dirPath = 'logs'
   const filePath = path.join(dirPath, 'comments.txt')
   if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
   }
   fs.appendFile(filePath, JSON.stringify(item, null, 2) + '\n', (err) => {
      if (err) {
         console.error('Error writing to file:', err)
      } else {
         // console.log('Comment saved to', filePath)
      }
   })
}

module.exports = () => ({
   name: 'getNewComments',

   // cronExpression: '0 0 12 1 1 *', // noon 1/1 (Park It)
   // cronExpression: '*/15 * * * * *', // Every 15 seconds (testing)
   // cronExpression: '0,7,15,22,30,37,45,52 * * * * *', // Every 7.5 seconds (live fast)
   cronExpression: '7,22,37,52 * * * * *', // Every 15 seconds (live slow)

   jobFunction: async () => {
      // logger.info({emoji: '💬', columns: ['getNewComments', `Fetching`, subreddit]});

      try {
         const comments = await reddit.getNewComments(subreddit, 25) // Fetch the latest 20 comments
         const newComments = []

         comments.forEach((comment) => {
            const commentId = comment.data.id
            if (
               !loggedCommentIds.has(commentId) &&
               new Date(comment.data.created_utc * 1000) >= startTime
            ) {
               // decode body and parent post title
               comment.data.body = decode(comment.data.body);
               comment.data.link_title = decode(comment.data.link_title);
               logger.info({
                  emoji: '💬',
                  columns: [
                     'New Comment',
                     comment.data.subreddit,
                     comment.data.author,
                     comment.data.body,
                  ],
               })
               newComments.push(comment.data)
               loggedCommentIds.add(commentId) // Mark the comment as logged
               saveItemsToFile(comment)
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
