const reddit = require('../modules/Reddit') // shared instance
const logger = require('../modules/Logger') // shared instance

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const config = require('../config')
const {
   subreddit,
   searchMode,
   searchString,
   fetchCount,
   fetchDelay,
   commentLimit,
   returnCount,
   ineligibleUsers,
} = config.jobs.getTopComments

async function getLatestPost() {
   logger.info({
      emoji: '🏅',
      columns: ['Top Comments', 'Find Post', subreddit, searchString],
   })

   const posts = await reddit.searchPosts(subreddit, searchString, 10) // Search for the latest 10 posts
   const exactMatchPosts = posts.filter((post) =>
      post.data.title.includes('Live Thread')
   ) // Filter for exact matches
   const post = exactMatchPosts[0] // Get the most recent post
   return post
}

async function getPostById(postId) {
   logger.info({
      emoji: '🏅',
      columns: ['Top Comments', 'Find Post', postId],
   })

   const posts = await reddit.getPostById(postId)
   if (posts.length > 0) {
      return posts[0]
   } else {
      return false;
   }
}

module.exports = () => ({
   name: 'getTopComments',
   // cronExpression: '0 0 12 1 1 *', // noon 1/1 (Park It)
   // cronExpression: '0 * * * * *', // Every 60 seconds (testing)
   cronExpression: '0 0 3 * * SAT,SUN', // Every Saturday and Sunday at 3am (live)

   jobFunction: async (jobParams = {}) => {
      try {
         let post
         logger.info({
            emoji: '🐞',
            columns: ['Top Comments', 'jobParams', JSON.stringify(jobParams)],
         })
         if (jobParams.postId) {
            logger.info({
               emoji: '🐞',
               columns: ['Top Comments', 'Using postId from jobParams', jobParams.postId],
            })
            post = await getPostById(jobParams.postId)
         } else if (searchMode == 'latest') {
            logger.info({
               emoji: '🐞',
               columns: ['Top Comments', 'Using searchMode', 'latest'],
            })
            post = await getLatestPost() 
         } else if (searchMode == 'id') {
            logger.info({
               emoji: '🐞',
               columns: ['Top Comments', 'Using searchMode', 'id', searchString],
            })
            post = await getPostById(searchString)
         }
         if (post) {
            const postId = post.data.id
            logger.info({
               emoji: '🏅',
               columns: ['Top Comments', 'Found Post', postId, post.data.title],
            })

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
               await delay(fetchDelay) // pause between repeated fetches
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

            // Filter ineligible users
            const filteredComments = commentAverages.filter((comment) => {
               const authorFlairText = comment.data.author_flair_text
               return (
                  !ineligibleUsers.includes(comment.data.author) &&
                  !(
                     authorFlairText &&
                     // authorFlairText.toLowerCase().includes('cotn royalty')
                     authorFlairText.toLowerCase().includes(':s3r:')
                  )
               )
            })

            // Sort by average score
            const sortedComments = filteredComments.sort(
               (a, b) => b.averageScore - a.averageScore
            )
            const topComments = sortedComments.slice(0, returnCount) // Get top comments

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

            return { status: 'success', data: topComments, post: post.data } // Return the top comments
         } else {
            logger.info('No matching posts found')
            return { status: 'failed' }
         }
      } catch (error) {
         console.error(`[${new Date().toLocaleString()}] Error fetching top comments:`, error.message)
         throw error
      }
   },
})
