module.exports = ({ reddit, logger }) => ({
   name: 'getNewComments',

   cronExpression: '0 0 12 1 1 *', // noon 1/1 (Park It)
   // cronExpression: '*/28 * * * * *', // Every 28 seconds (live and testing)
   jobFunction: async () => {
      const subreddit = 'OPLTesting'; // Replace with the target subreddit
      // logger.info({emoji: '💬', columns: ['getNewComments', `Fetching`, subreddit]});
      const loggedCommentIds = new Set();
      const startTime = new Date(); // When the job was first scheduled

      try {
         const comments = await reddit.getNewComments(subreddit, 10); // Fetch the latest 10 comments
         const newComments = [];

         comments.forEach(comment => {
            const commentId = comment.data.id;
            if (!loggedCommentIds.has(commentId) && new Date(comment.data.created_utc * 1000) >= startTime) {
                  // logger.info({
                  //    emoji: '💬',
                  //    columns: [
                  //       'getNewComments',
                  //       'Found',
                  //       comment.data.author,
                  //       comment.data.body,
                  //    ],
                  // })
               newComments.push({
                  author: comment.data.author,
                  body: comment.data.body,
                  created_utc: comment.data.created_utc
               });
               loggedCommentIds.add(commentId); // Mark the comment as logged
            }
         });

         return { data: newComments};
      } catch (error) {
         console.error(
            'getNewComments: Error fetching new comments:',
             error.message
            );
         throw error;
      }
   }
});
