const path = require('path');
const Scheduler = require('./modules/Scheduler');
const Reddit = require('./modules/Reddit');
const { channel } = require('diagnostics_channel');
const Logger = require('./modules/Logger');
// const Discord = require('./modules/Discord');
// const { discordToken } = require('./config');

const scheduler = new Scheduler();
const reddit = new Reddit();
const logger = new Logger();

// const discord = new Discord(discordToken);

// discord.client.on('ready', () => {
//   console.log(`Logged in as ${discord.client.user.tag}!`);
// });

// discord.client.on('messageCreate', (message) => {
//   if (message.content === '!ping') {
//     message.channel.send('Pong!');
//   }
// });

scheduler.on('jobScheduled', (name, cronExpression) => {
  // console.log(`Job "${name}" scheduled with cron expression "${cronExpression}"`);
  logger.info(["Scheduler", "Schedule Job", name, cronExpression]);
});

scheduler.on('jobCancelled', (name) => {
  // console.log(`Job "${name}" cancelled`);
  logger.info({
    emoji: '⏲️',
    columns: ['Scheduler', 'Cancel Job', name ]
  })
});

const jobsFolderPath = path.join(__dirname, 'jobs');
scheduler.loadJobsFromFolder(jobsFolderPath, { reddit, logger });

// (async () => {
//   try {
//     await discord.login();
//   } catch (error) {
//     console.error('Error logging into Discord:', error);
//   }
// })();
