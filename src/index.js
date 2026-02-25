const path = require('path')
const scheduler = require('./modules/Scheduler')
const reddit = require('./modules/Reddit')
const { channel } = require('diagnostics_channel')
const logger = require('./modules/Logger')
const Discord = require('./modules/Discord')
const { Events } = require('discord.js')

const { discordToken } = require('./credentials')
// const scheduler = new Scheduler()

// const logger = new Logger()
const discord = new Discord(discordToken)
const broker = require('./utils/message-broker')

scheduler.on('jobScheduled', (name, cronExpression) => {
   logger.info({
      emoji: '⏰',
      columns: ['Scheduler', 'Schedule Job', name, cronExpression],
   })
})

scheduler.on('jobCancelled', (name) => {
   logger.info({ emoji: '⏰', columns: ['Scheduler', 'Cancel Job', name] })
})

scheduler.on('jobUpdated', (name, cronExpression) => {
   logger.info({
      emoji: '⏰',
      columns: ['Scheduler', 'Updated Job', name, cronExpression],
   })
})

scheduler.on('jobCompleted', (name, result) => {
   const discordResult = broker.processDiscordMessage(
      discord.client,
      name,
      result
   )
})

const jobsFolderPath = path.join(__dirname, 'jobs')
;(async () => {
   try {
      await discord.login()
      // Ensure the client is fully ready and any ready handlers have run
      await new Promise((resolve) => discord.client.once(Events.ClientReady, resolve))

      // Load and schedule jobs after Discord is ready so `client.params` is initialized
      scheduler.loadJobsFromFolder(jobsFolderPath, { reddit, logger })
   } catch (error) {
      console.error(`[${new Date().toLocaleString()}] Error logging into Discord:`, error)
   }
})()
