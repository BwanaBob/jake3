const { writeFileSync, readFileSync, existsSync } = require('fs');

const conversationsStoragePath = './modmail_conversations.json';
const messagesStoragePath = './modmail_messages.json';

const loadStoredData = (path) => {
  if (existsSync(path)) {
    const data = readFileSync(path, 'utf8');
    return JSON.parse(data);
  }
  return {};
};

const saveData = (path, data) => {
  writeFileSync(path, JSON.stringify(data, null, 2));
};

module.exports = ({ reddit, logger }) => ({
  name: 'fetchNewModmailMessages',
  cronExpression: '*/15 * * * * *', // Every 15 seconds
  jobFunction: async () => {
    logger.info('Fetching modmail conversations');
    try {
      const { conversations, conversationIds } = await reddit.fetchAllModmailConversations();
      const storedConversations = loadStoredData(conversationsStoragePath);
      const storedMessages = loadStoredData(messagesStoragePath);
      const newStoredConversations = { ...storedConversations };
      const newStoredMessages = { ...storedMessages };

      const newMessagesToReturn = [];

      for (const conversationId of conversationIds) {
        const conversation = conversations[conversationId];
        const lastUpdated = conversation.lastUpdated || 0;

        if (!storedConversations[conversationId] || storedConversations[conversationId] < lastUpdated) {
          logger.info(`New messages in conversation ${conversationId}`);
          const messages = await reddit.fetchModmailMessages(conversationId);
         //  console.log(messages);
          const newMessages = messages.filter(
            (message) => !storedMessages[conversationId] || !storedMessages[conversationId].includes(message.id)
          );

          if (newMessages.length > 0) {
            newMessagesToReturn.push({
              conversationId,
              messages: newMessages.map(message => ({
                author: message.author.name,
                body: message.bodyMarkdown,
                id: message.id
              }))
            });

            newStoredMessages[conversationId] = [
              ...(storedMessages[conversationId] || []),
              ...newMessages.map((message) => message.id)
            ];
          }
          newStoredConversations[conversationId] = lastUpdated;
        }
      }

      saveData(conversationsStoragePath, newStoredConversations);
      saveData(messagesStoragePath, newStoredMessages);

      return newMessagesToReturn;
    } catch (error) {
      console.error('Error fetching modmail messages:', error.message);
      throw error;
    }
  },
});
