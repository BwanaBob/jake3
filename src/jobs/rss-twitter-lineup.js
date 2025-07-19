const RssWatcher = require('../modules/RssWatcher')
// const discord = require('../modules/Discord')
const logger = require('../modules/Logger')

// const FEED_URL = 'https://status.openai.com/feed.rss'
// const FEED_URL = 'https://redditstatus.com/feed'
const FEED_URL = 'https://rss.xcancel.com/danabrams/rss'

module.exports = () => ({
   name: 'rssTwitterLineup',
   // cronExpression: '0 * * * * *', // Every 60 seconds (testing)
   // cronExpression: '*/2 16-18 * * 5,6', // Every 2 minutes, Friday & Saturday, 4-6pm
   cronExpression: '0 0 12 11 1 *', // noon 1/1 (Park It)
   jobFunction: async () => {
      if (!module.exports._watcher) {
         module.exports._watcher = new RssWatcher({
            feedUrl: FEED_URL,
         })
      }
      const watcher = module.exports._watcher
      try {
         logger.info({ emoji: '📰', columns: ['RSS', 'Twitter Lineup', 'Checking'] })
         const newItems = await watcher.checkAndNotify()
         newItems.forEach((item) => {
            logger.info({
               emoji: '📰',
               columns: ['RSS', 'Twitter Lineup', item.title, item.link],
            })
         })
         return { status: 'success', data: newItems }
      } catch (err) {
         logger.error({ emoji: '📰', columns: ['RSS', 'Error', err.message] })
      }
   },
})
