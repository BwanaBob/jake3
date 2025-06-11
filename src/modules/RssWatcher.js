const Parser = require('rss-parser');
const fs = require('fs');
const path = require('path');
const logger = require('./Logger'); // Ensure logger is always available

class RssWatcher {
   constructor({ feedUrl, persistKey }) {
      this.feedUrl = feedUrl;
      this.persistKey = persistKey || this._sanitizeKey(feedUrl);
      this.parser = new Parser();
      this.persistPath = path.join(__dirname, '..', 'logs', `rss-${this.persistKey}.json`);
      this.seenGuids = new Set();
      this._loadSeen();
   }

   _sanitizeKey(url) {
      return url.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40);
   }

   _loadSeen() {
      if (fs.existsSync(this.persistPath)) {
         try {
            const data = JSON.parse(fs.readFileSync(this.persistPath, 'utf8'));
            this.seenGuids = new Set(data.guids || []);
         } catch (e) {
            this.seenGuids = new Set();
         }
      }
   }

   _saveSeen() {
      fs.writeFileSync(this.persistPath, JSON.stringify({ guids: Array.from(this.seenGuids) }, null, 2));
   }

   async checkAndNotify() {
      // console.log("checking feed");
      const feed = await this.parser.parseURL(this.feedUrl);
      const newItems = [];
      // console.log(`Items: ${feed.items.length}`);
      for (const item of feed.items) {
         const guid = item.guid || item.link;
         if (!this.seenGuids.has(guid)) {
            newItems.push(item);
            this.seenGuids.add(guid);
         }
      }
      if (newItems.length > 0) {
         // logger.info({ emoji: '📰', columns: ['RSS', 'New Items', newItems.length] });
         this._saveSeen();
      }
      return newItems;
   }
}

module.exports = RssWatcher;
