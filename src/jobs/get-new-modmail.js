const config = require('../config')
const { subreddit } = config.jobs.getNewModMail
const { readBehind } = config
const startTime = new Date() - readBehind * 1000 // When the job was first scheduled

let loggedMessageIds = new Set()

function enrichMessages(data) {
   const { conversations, messages, conversationIds } = data

   // Create a mapping of messageId to parent conversation details
   const messageToConversationMap = {}

   for (const conversationId of conversationIds) {
      const conversation = conversations[conversationId]
      const messageIds = conversation.objIds
      //   console.log(messageIds);
      // console.log(conversation)

      for (const messageId of messageIds) {
         messageToConversationMap[messageId.id] = {
            parentId: conversationId || 'unknown',
            parentSubject: conversation.subject || 'unknown',
            parentOwnerType: conversation.owner.type || 'unknown',
            parentOwnerDisplayName: conversation.owner.displayName || 'unknown',
         }
      }
   }

   // console.log(messageToConversationMap);
   // Enrich each message with parent conversation details
   for (const messageId in messages) {
      const message = messages[messageId]

      if (messageToConversationMap[messageId]) {
         message.parentId = messageToConversationMap[messageId].parentId
         message.parentSubject =
            messageToConversationMap[messageId].parentSubject
         message.parentOwnerType =
            messageToConversationMap[messageId].parentOwnerType
         message.parentOwnerDisplayName =
            messageToConversationMap[messageId].parentOwnerDisplayName
      }
   }

   return messages
}

module.exports = ({ reddit, logger }) => ({
   name: 'getNewModMail',

   // cronExpression: '0 0 12 1 1 *', // noon 1/1 (Park It)
   cronExpression: '11,41 * * * * *', // Every 30 seconds (live and testing)

   jobFunction: async () => {
      // logger.info({emoji: '💬', columns: ['getNewComments', `Fetching`, subreddit]});

      try {
         const data = await reddit.fetchAllModmailConversations(subreddit, 100) // Fetch the latest 20 comments
         const newMessages = []
         // console.log(data);
         const enrichedMessages = enrichMessages(data)
         // console.log(enrichedMessages)

         // const remainingMessages = Object.values(data.messages).filter(
         const remainingMessages = Object.values(enrichedMessages).filter(
            (message) => new Date(message.date) > startTime
         )
         remainingMessages.forEach((message) => {
            // console.log(message);
            if (!loggedMessageIds.has(message.id)) {
               logger.info({
                  emoji: '💬',
                  columns: [
                     'New ModMail',
                     // 'Found',
                     //  message.id,
                     message.parentOwnerDisplayName,
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
         console.error('getNewModMail: Error fetching new ModMail:', error)
         throw error
      }
   },
})
