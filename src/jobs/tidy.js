const reddit = require('../modules/Reddit') // shared instance
const logger = require('../modules/Logger') // shared instance
const config = require('../config')
const {
   subreddit,
   searchString,
   searchSize,
   searchFlairName,
   targetFlairName,
} = config.jobs.tidy

async function getCurrentLiveThread() {
   logger.info({
      emoji: '🧹',
      columns: ['tidy', `Find Post`, subreddit, searchString],
   })
   try {
      const posts = await reddit.searchPosts(
         subreddit,
         searchString,
         searchSize
      ) // Search for the latest 20 posts
      const post = posts.find(
         (post) =>
            post.data.stickied &&
            post.data.link_flair_text &&
            post.data.link_flair_text
               .toLowerCase()
               .includes(searchFlairName.toLowerCase()) &&
            post.data.title.toLowerCase().includes(searchString.toLowerCase())
      ) // Narrow results using flair
      if (post) {
         logger.info({
            emoji: '🧹',
            columns: ['tidy', `Found Post`, subreddit, post.data.title],
         })
         return post
      } else {
         logger.info({
            emoji: '🧹',
            columns: ['tidy', `Post Not Found`, subreddit, searchString],
         })
         return null
      }
   } catch (error) {
      console.error('Tidy Error Locating Live Thread:', error.message)
   }
}

async function getTargetFlairId() {
   // Look up the flair ID by name
   try {
      const flairs = await reddit.getSubredditFlairs(subreddit)
      const targetFlair = flairs.find(
         (flair) => flair.text.toLowerCase() == targetFlairName.toLowerCase()
      )
      if (!targetFlair) {
         throw new Error(`Flair with name "${targetFlairName}" not found`)
      }
      logger.info({
         emoji: '🧹',
         columns: ['tidy', `Found Flair`, subreddit, targetFlairName],
      })
      return targetFlair.id
   } catch (error) {
      console.error('Tidy Error Locating Target Flair:', error.message)
   }
}

module.exports = () => ({
   name: 'tidy',
   // cronExpression: '0 0 12 1 1 *', // noon 1/1 (Park It)
   // cronExpression: '*/20 * * * * *', // Every 20 seconds (testing)
   cronExpression: '20 0 23 * * FRI,SAT', // Every Friday and Saturday at 11:00:20pm (live)
   jobFunction: async () => {
      let result = { status: 'failed', data: { subreddit: subreddit } }
      try {
         const post = await getCurrentLiveThread()
         if (post) {
            const targetFlairId = await getTargetFlairId()

            if (targetFlairId) {
               await reddit.updatePostFlair(post.data.id, targetFlairId)
            } else {
               result.status = 'Target flair not found'
            }

            await reddit.updatePostSticky(post.data.id, false)
            result.status = 'processed'
            result.data = {
               id: post.data.id,
               subreddit: post.data.subreddit,
               title: post.data.title,
               url: post.data.url,
            }
            logger.info({
               emoji: '🧹',
               columns: ['tidy', `Processed Post`, subreddit, post.data.title],
            })
         } else {
            result.status = 'Post not found'
         }
         return result
      } catch (error) {
         console.error('Tidy Error:', error.message)
      }
   },
})
