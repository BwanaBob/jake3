const { decode } = require('html-entities')
const reddit = require('../modules/Reddit') // shared instance
const logger = require('../modules/Logger') // shared instance
// const logger = new Logger()

const config = require('../config')
const { subreddit } = config.jobs.getNewPosts
const { readBehind } = config
const startTime = new Date() - readBehind * 1000 // When the job was first scheduled

let loggedPostIds = new Set()
const fs = require('fs')
const path = require('path')

function saveItemsToFile(item) {
   const dirPath = 'logs'
   const filePath = path.join(dirPath, 'posts.txt')
   if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
   }
   fs.appendFile(filePath, JSON.stringify(item, null, 2) + '\n', (err) => {
      if (err) {
         console.error(`[${new Date().toLocaleString()}] Error writing to file:`, err)
      } else {
         // console.log('Comment saved to', filePath)
      }
   })
}

module.exports = () => ({
   name: 'getNewPosts',
   // cronExpression: '0 0 12 1 1 *', // noon 1/1 (Park It)
   //    cronExpression: '*/15 * * * * *', // Every 15 seconds (testing)
   cronExpression: '26,56 * * * * *', // Every 30 seconds (live)

   jobFunction: async () => {
      // logger.info({emoji: '📌', columns: ['getNewPosts', `Fetching`, subreddit]});

      try {
         const posts = await reddit.getNewPosts(subreddit, 6) // Fetch the latest 6 posts
         const newPosts = []

         posts.forEach((post) => {
            const postId = post.data.id
            if (
               !loggedPostIds.has(postId) &&
               new Date(post.data.created_utc * 1000) >= startTime
            ) {
               //decode fields
               post.data.title = decode(post.data.title)
               if (post.data.selftext) {
                  post.data.selftext = decode(post.data.selftext)
               }
               logger.info({
                  emoji: '📌',
                  columns: [
                     'New Post',
                     // 'Found',
                     post.data.subreddit,
                     post.data.author,
                     post.data.title,
                  ],
               })
               newPosts.push(post.data)
               loggedPostIds.add(postId) // Mark the Post as logged
               saveItemsToFile(post)
            }
         })
         return { status: 'success', data: newPosts }
      } catch (error) {
         console.error(`[${new Date().toLocaleString()}] [getNewPosts] Error fetching new posts:`, error.message)
         throw error
      }
   },
})
