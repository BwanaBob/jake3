module.exports = ({ reddit, logger }) => ({
   name: 'tidy',
   // cronExpression: '0 0 12 1 1 *', // noon 1/1 (Park It)
   // cronExpression: '*/20 * * * * *', // Every 20 seconds (testing)
   cronExpression: '0 0 23 * * FRI,SAT', // Every Friday and Saturday at 11pm (live)
   jobFunction: async () => {
      const subreddit = 'OPLTesting' // Replace with the target subreddit
      const searchString = 'Live Thread' // Replace with the target string in the title
      const targetFlairName = 'Past Live Thread' // Replace with the target flair name
      const searchFlairName = '🚨 Live Thread 🚨'

      logger.info({
         emoji: '🧹',
         columns: ['tidy', `Find Post`, subreddit, searchString],
      })
      try {
         const posts = await reddit.searchPosts(subreddit, searchString, 5) // Search for the latest 20 posts
         // console.log(posts);
         const post = posts.find(
            (post) =>
               post.data.link_flair_text === searchFlairName &&
               post.data.stickied == true
         ) // Narrow results using flair

         if (post) {
            logger.info({
               emoji: '🧹',
               columns: ['tidy', `Found Post`, subreddit, post.data.title],
            })

            // Look up the flair ID by name
            const flairs = await reddit.getSubredditFlairs(subreddit)
            const targetFlair = flairs.find(
               (flair) => flair.text === targetFlairName
            )

            if (!targetFlair) {
               throw new Error(`Flair with name "${targetFlairName}" not found`)
            }

            const targetFlairId = targetFlair.id
            logger.info({
               emoji: '🧹',
               columns: [
                  'tidy',
                  `Found Flair`,
                  subreddit,
                  targetFlairName,
                  targetFlairId,
               ],
            })

            await reddit.updatePostFlair(post.data.id, targetFlairId)
            await reddit.updatePostSticky(post.data.id, false)
            logger.info({
               emoji: '🧹',
               columns: ['tidy', `Processed Post`, subreddit, post.data.title],
            })
         } else {
            logger.info({
               emoji: '🧹',
               columns: ['tidy', `Post Not Found`, subreddit, searchString],
            })
         }
      } catch (error) {
         console.error('Error updating post flair and sticky:', error.message)
      }
   },
})
