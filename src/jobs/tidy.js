const reddit = require('../modules/Reddit') // shared instance
const logger = require('../modules/Logger') // shared instance
// const logger = new Logger()

// module.exports = ({ reddit, logger }) => ({
module.exports = () => ({
   name: 'tidy',
   // cronExpression: '0 0 12 1 1 *', // noon 1/1 (Park It)
   // cronExpression: '*/20 * * * * *', // Every 20 seconds (testing)
   cronExpression: '20 0 23 * * FRI,SAT', // Every Friday and Saturday at 11:00:20pm (live)
   // cronExpression: '20 0 00 * * SUN', // Special 4 hour episode on Sat 12:00:20am (special)
   jobFunction: async () => {
      const subreddit = 'OnPatrolLive' // subreddit to search
      const searchString = 'Live Thread' // Post title to locate
      const searchFlairName = 'Live Thread' // Post flair to locate and change
      const targetFlairName = 'Past Live Thread' // Post flair to change to
      let result = { status: 'failed' }
      logger.info({
         emoji: '🧹',
         columns: ['tidy', `Find Post`, subreddit, searchString],
      })
      try {
         const posts = await reddit.searchPosts(subreddit, searchString, 20) // Search for the latest 20 posts
         const post = posts.find(
            (post) =>
               post.data.stickied &&
               post.data.link_flair_text &&
               post.data.link_flair_text
                  .toLowerCase()
                  .includes(searchFlairName.toLowerCase()) &&
               post.data.title
                  .toLowerCase()
                  .includes(searchString.toLowerCase())
         ) // Narrow results using flair
         if (post) {
            logger.info({
               emoji: '🧹',
               columns: ['tidy', `Found Post`, subreddit, post.data.title],
            })
            // Look up the flair ID by name
            const flairs = await reddit.getSubredditFlairs(subreddit)
            const targetFlair = flairs.find(
               (flair) =>
                  flair.text.toLowerCase() == targetFlairName.toLowerCase()
            )
            if (!targetFlair) {
               throw new Error(`Flair with name "${targetFlairName}" not found`)
            }
            const targetFlairId = targetFlair.id
            logger.info({
               emoji: '🧹',
               columns: ['tidy', `Found Flair`, subreddit, targetFlairName],
            })
            await reddit.updatePostFlair(post.data.id, targetFlairId)
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
            result.status = 'not found'
            logger.info({
               emoji: '🧹',
               columns: ['tidy', `Post Not Found`, subreddit, searchString],
            })
         }
         return result
      } catch (error) {
         console.error('Error updating post flair and sticky:', error.message)
      }
   },
})
