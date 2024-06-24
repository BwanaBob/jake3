const { readBehind } = require('../config')
const startTime = new Date() - (readBehind * 1000)// When the job was first scheduled

let loggedPostIds = new Set()
const subreddit = 'OPLTesting+OnPatrolLive' // Replace with the target subreddit

module.exports = ({ reddit, logger }) => ({
   name: 'getNewPosts',
   // cronExpression: '0 0 12 1 1 *', // noon 1/1 (Park It)
//    cronExpression: '*/15 * * * * *', // Every 15 seconds (testing)
   cronExpression: '26,56 * * * * *', // Every 30 seconds (live)

   jobFunction: async () => {
      // logger.info({emoji: '💬', columns: ['getNewPosts', `Fetching`, subreddit]});

      try {
         const posts = await reddit.getNewPosts(subreddit, 6) // Fetch the latest 6 posts
         const newPosts = []

         posts.forEach((post) => {
            const postId = post.data.id
            if (
               !loggedPostIds.has(postId)
               && new Date(post.data.created_utc * 1000) >= startTime
            ) {
               logger.info({
                  emoji: '💬',
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
            }
         })
         return { status: 'success', data: newPosts }
      } catch (error) {
         console.error(
            'getNewPosts: Error fetching new posts:',
            error.message
         )
         throw error
      }
   },
})
