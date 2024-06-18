const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const fetchTopComments = async (reddit, logger, subreddit, searchString, fetchCount = 5, commentLimit = 100) => {
  logger.info(`Searching for posts with string: "${searchString}" in subreddit: ${subreddit}`);

  try {
    const posts = await reddit.searchPosts(subreddit, searchString, 10); // Search for the latest 10 posts
    const exactMatchPosts = posts.filter(post => post.data.title.includes('Live Thread')); // Filter for exact matches
    const post = exactMatchPosts[0]; // Get the most recent post

    if (post) {
      const postId = post.data.id;
      logger.info(`Found post to analyze comments: ${post.data.title} (ID: ${postId})`);

      // Retrieve comments multiple times
      const allComments = {};
      let allFetchedComments = [];

      for (let i = 0; i < fetchCount; i++) {
        const comments = await reddit.getCommentsForPost(postId, commentLimit); // Fetch comments
        allFetchedComments = allFetchedComments.concat(comments);
        comments.forEach(comment => {
          const commentId = comment.data.id;
          if (!allComments[commentId]) {
            allComments[commentId] = [];
          }
          allComments[commentId].push(comment.data.score);
        });
        await delay(2000); // 2-second delay between each fetch
      }

      // Calculate average scores
      const commentAverages = Object.keys(allComments).map(commentId => {
        const scores = allComments[commentId];
        const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        const commentData = allFetchedComments.find(comment => comment.data.id === commentId).data;
        return { commentId, averageScore, data: commentData };
      });

      // Sort by average score
      const sortedComments = commentAverages.sort((a, b) => b.averageScore - a.averageScore);
      const topComments = sortedComments.slice(0, 10); // Get top 10 comments

      logger.info(`Top 10 comments for post: ${post.data.title}`);
      topComments.forEach((comment, index) => {
        logger.info({
          emoji: '🏅',
          columns: [{min:5, max:5, text:'COTN'}, {min:18, max:18, text: comment.data.author}, {min: 10, max:10, text: comment.data.id}, `${comment.averageScore.toFixed(2)} (${comment.data.ups}-${comment.data.downs})`, comment.data.body]
        });
      });

      return topComments; // Return the top comments
    } else {
      logger.info('No matching posts found');
      return [];
    }
  } catch (error) {
    console.error('Error fetching top comments:', error.message);
    throw error;
  }
};

module.exports = {
  fetchTopComments,
};
