const RssWatcher = require('../modules/RssWatcher')
const logger = require('../modules/Logger')

const FEED_URL = 'https://status.openai.com/feed.rss'
// const FEED_URL = 'https://redditstatus.com/feed'
// const FEED_URL = 'https://www.redditstatus.com/history.rss'

module.exports = () => ({
   name: 'rssOpenAIStatus',
   // cronExpression: '0 * * * * *', // Every 60 seconds (testing)
   cronExpression: '*/10 * * * *', // Every 10 minutes
   jobFunction: async () => {
      if (!module.exports._watcher) {
         module.exports._watcher = new RssWatcher({
            feedUrl: FEED_URL,
         })
      }
      const watcher = module.exports._watcher
      try {
         // logger.info({ emoji: '📰', columns: ['RSS', 'Reddit Status', 'Checking'] })
         const newItems = await watcher.checkAndNotify()
         newItems.forEach((item) => {
            logger.info({
               emoji: '📰',
               columns: ['RSS', 'OpenAI Status', item.title, item.link],
            })
         })
         return { status: 'success', data: newItems }
      } catch (err) {
         logger.error({ emoji: '📰', columns: ['RSS', 'Error', err.message] })
      }
   },
})
