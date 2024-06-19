const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

module.exports = ({ reddit, logger }) => ({
   name: 'getTopComments',
   // cronExpression: '0 0 12 1 1 *', // noon 1/1 (Park It)
   cronExpression: '*/30 * * * * *', // Every 30 seconds (testing)
   // cronExpression: '0 0 3 * * SAT,SUN', // Every Saturday and Sunday at 3am (live)
   jobFunction: async () => {
      const subreddit = 'OnPatrolLive' // Replace with the target subreddit
      const searchString = 'title:"Live Thread"' // Search for the exact phrase in the title
      const fetchCount = 5;
      const commentLimit = 100;
      try {
         logger.info( {emoji: "🏅", columns: [`Searching for posts with string: "${searchString}" in subreddit: ${subreddit}`]})

         const posts = await reddit.searchPosts(subreddit, searchString, 10) // Search for the latest 10 posts
         const exactMatchPosts = posts.filter((post) =>
            post.data.title.includes('Live Thread')
         ) // Filter for exact matches
         const post = exactMatchPosts[0] // Get the most recent post

         if (post) {
            const postId = post.data.id
            logger.info(
               `Found post to analyze comments: ${post.data.title} (ID: ${postId})`
            )

            // Retrieve comments multiple times
            const allComments = {}
            let allFetchedComments = []

            for (let i = 0; i < fetchCount; i++) {
               const comments = await reddit.getCommentsForPost(
                  postId,
                  commentLimit
               ) // Fetch comments
               allFetchedComments = allFetchedComments.concat(comments)
               comments.forEach((comment) => {
                  const commentId = comment.data.id
                  if (!allComments[commentId]) {
                     allComments[commentId] = []
                  }
                  allComments[commentId].push(comment.data.score)
               })
               await delay(2000) // 2-second delay between each fetch
            }

            // Calculate average scores
            const commentAverages = Object.keys(allComments).map(
               (commentId) => {
                  const scores = allComments[commentId]
                  const averageScore =
                     scores.reduce((sum, score) => sum + score, 0) /
                     scores.length
                  const commentData = allFetchedComments.find(
                     (comment) => comment.data.id === commentId
                  ).data
                  return { commentId, averageScore, data: commentData }
               }
            )

            // Sort by average score
            const sortedComments = commentAverages.sort(
               (a, b) => b.averageScore - a.averageScore
            )
            const topComments = sortedComments.slice(0, 10) // Get top 10 comments

            // logger.info(`Top 10 comments for post: ${post.data.title}`)
            // topComments.forEach((comment, index) => {
               // logger.info({
               //    emoji: '🏅',
               //    columns: [
               //       { min: 5, max: 5, text: 'COTN' },
               //       { min: 18, max: 18, text: comment.data.author },
               //       { min: 10, max: 10, text: comment.data.id },
               //       `${comment.averageScore.toFixed(2)} (${comment.data.ups}-${
               //          comment.data.downs
               //       })`,
               //       comment.data.body,
               //    ],
               // })
               // console.log(comment.data)
            // })

            return {result: "success", data: topComments}; // Return the top comments
         } else {
            logger.info('No matching posts found')
            return {result: "failed"};
         }
      } catch (error) {
         console.error('Error fetching top comments:', error.message)
         throw error
      }
   },
})
