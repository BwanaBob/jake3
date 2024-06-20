const path = require('path');
const Scheduler = require('./modules/Scheduler');
const Reddit = require('./modules/Reddit');
const { channel } = require('diagnostics_channel');
const Logger = require('./modules/Logger');
const Discord = require('./modules/Discord');

const { discordToken } = require('./config');
const scheduler = new Scheduler();
const reddit = new Reddit();
const logger = new Logger();
const discord = new Discord(discordToken);
const broker = require('./utils/message-broker')

scheduler.on('jobScheduled', (name, cronExpression) => {
  // console.log(`Job "${name}" scheduled with cron expression "${cronExpression}"`);
  logger.info({emoji: '⏰', columns: ["Scheduler", "Schedule Job", name, cronExpression]});
});

scheduler.on('jobCancelled', (name) => {
  // console.log(`Job "${name}" cancelled`);
  logger.info({ emoji: '⏰', columns: ['Scheduler', 'Cancel Job', name ]})
});

scheduler.on('jobCompleted', (name, result) => {
  logger.info({ emoji: '⏰', columns: ['Scheduler', 'Job Complete', name ]})
  const discordResult = broker.processDiscordMessage(discord.client, name, result)
  // console.log(result);
});

const jobsFolderPath = path.join(__dirname, 'jobs');
scheduler.loadJobsFromFolder(jobsFolderPath, { reddit, logger });

(async () => {
  try {
    // console.log("logging in")
    await discord.login();
  } catch (error) {
    console.error('Error logging into Discord:', error);
  }
})();
