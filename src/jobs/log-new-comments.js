module.exports = ({ reddit, logger }) => {
    const loggedCommentIds = new Set();
  
    return {
      name: 'logNewComments',
      cronExpression: '*/15 * * * * *', // Every 10 minutes
      jobFunction: async () => {
        const subreddit = 'OPLTesting'; // Replace with the target subreddit
        logger.info(`Fetching new comments for subreddit: ${subreddit}`);
        try {
          const comments = await reddit.getNewComments(subreddit, 10); // Fetch the latest 10 comments
          comments.forEach(comment => {
            const commentId = comment.data.id;
            if (!loggedCommentIds.has(commentId)) {
              logger.info(`New comment by ${comment.data.author}: ${comment.data.body}`);
              loggedCommentIds.add(commentId); // Mark the comment as logged
            }
          });
        } catch (error) {
          logger.error('Error fetching new comments:', error.message);
        }
      }
    };
  };
  