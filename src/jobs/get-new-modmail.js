let loggedMessageIds = new Set()
const startTime = new Date() // When the job was first scheduled
// const subreddit = 'OPLTesting+OnPatrolLive' // Replace with the target subreddit
const subreddit = 'OPLTesting' // Replace with the target subreddit

module.exports = ({ reddit, logger }) => ({
   name: 'getNewModMail',

  //  cronExpression: '0 0 12 1 1 *', // noon 1/1 (Park It)
   cronExpression: '11,41 * * * * *', // Every 15 seconds (live and testing)

   jobFunction: async () => {
      // logger.info({emoji: '💬', columns: ['getNewComments', `Fetching`, subreddit]});

      try {
         const data = await reddit.fetchAllModmailConversations(subreddit, 100) // Fetch the latest 20 comments
         const newMessages = []
         const remainingMessages = Object.values(data.messages).filter(message => new Date(message.date) > startTime);
         remainingMessages.forEach((message) => {
            if (
               !loggedMessageIds.has(message.id)
            ) {
               logger.info({
                  emoji: '💬',
                  columns: [
                     'getNewModMail',
                     'Found',
                    //  message.id,
                     message.author.name,
                     message.bodyMarkdown,
                  ],
               })
               newMessages.push(message)
               loggedMessageIds.add(message.id) // Mark the comment as logged
            }
         })
         return { status: 'success', data: newMessages }
      } catch (error) {
         console.error(
            'getNewModMail: Error fetching new ModMail:',
            error.message
         )
         throw error
      }
   },
})
