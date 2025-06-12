const fs = require('fs');
const path = require('path');

const THREADS_FILE = path.join(__dirname, '..', '..', 'logs', 'discord-threads.json');

function loadThreadIds() {
   if (fs.existsSync(THREADS_FILE)) {
      try {
         return JSON.parse(fs.readFileSync(THREADS_FILE, 'utf8'));
      } catch (e) {
         return {};
      }
   }
   return {};
}

function saveThreadIds(threadMap) {
   try {
      fs.writeFileSync(THREADS_FILE, JSON.stringify(threadMap, null, 2));
   } catch (e) {
      // Optionally log error
   }
}

module.exports = { loadThreadIds, saveThreadIds, THREADS_FILE };
