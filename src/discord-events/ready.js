const {
   Events,
   ActivityType,
   Collection,
   ThreadAutoArchiveDuration,
} = require('discord.js')
const logger = require('../modules/Logger')
// const logger = new Logger()
const setupDiscordChannels = require('../utils/discord-channels')

module.exports = {
   name: Events.ClientReady,
   once: true,
   async execute(client) {
      logger.info({
         emoji: '🤖',
         columns: [
            'Discord',
            'Logged In',
            client.user.username,
            client.user.tag, 
         ],
      })

      setupDiscordChannels.execute(client)

      client.guilds.cache.forEach((guild) => {
         logger.info({
            emoji: '💻',
            columns: [ 'Discord', 'Guild Joined', guild.name ],
         })
      })

      let discordStatus = {
         status: 'online',
         activities: [
            {
               type: ActivityType.Custom,
               state: '🐾 Fetching Reddit gifties!',
               name: '🐾 Fetching Reddit gifties!',
            },
         ],
      }
      client.user.setPresence(discordStatus)

      // Determine which servers/channels to send messages to
      let oplGuildId = '325206992413130753'
      let testGuildId = '391821567241224192'
      let oplChannelId = ''
      const channelName = 'reddit'
      let oplChannel = {}

      const oplGuild = client.guilds.cache.get(oplGuildId)
      const testGuild = client.guilds.cache.get(testGuildId)
      if (oplGuild) {
         //bot is a member of OPL
         oplChannel = await oplGuild.channels.cache.find(
            (channel) => channel.name === channelName
         )
      } else if (testGuild) {
         oplChannel = await testGuild.channels.cache.find(
            (channel) => channel.name === channelName
         )
      } else {
         console.error('Failed to locate discord channel')
      }

      // console.log(oplChannel.guild.name, oplChannel.name, oplChannel.id);
      client.params = new Collection()
      client.params.set('oplChannelId', oplChannel.id)

      // Turn this into a loop using config items
      let tidyThread = {} // find or create thread for the tidy job
      const tidyThreadName = 'Jobs'
      const tfindThread = await oplChannel.threads.cache.find(
         (x) => x.name === tidyThreadName
      )
      if (tfindThread) {
         tidyThread = tfindThread
         if (tidyThread.joinable) await tidyThread.join()
      } else {
         tidyThread = await oplChannel.threads.create({
            name: tidyThreadName,
            autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
            joinable: true,
            reason: 'A separate thread for jobs',
         })
         await tidyThread.setArchived(false) // unarchived
      }
      client.params.set('jobsChannelId', tidyThread.id)

      let streamThread = {} // find or create thread for the tidy job
      const streamThreadName = 'Stream'
      const sfindThread = await oplChannel.threads.cache.find(
         (x) => x.name === streamThreadName
      )
      if (sfindThread) {
         streamThread = sfindThread
         if (streamThread.joinable) await streamThread.join()
      } else {
         streamThread = await oplChannel.threads.create({
            name: streamThreadName,
            autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
            joinable: true,
            reason: 'A separate thread for the stream',
         })
         await streamThread.setArchived(false) // unarchived
      }
      client.params.set('streamChannelId', streamThread.id)

      let queueThread = {} // find or create thread for the tidy job
      const queueThreadName = 'Mod Queue'
      const qfindThread = await oplChannel.threads.cache.find(
         (x) => x.name === queueThreadName
      )
      if (qfindThread) {
         queueThread = qfindThread
         if (queueThread.joinable) await queueThread.join()
      } else {
         queueThread = await oplChannel.threads.create({
            name: queueThreadName,
            autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
            joinable: true,
            reason: 'A separate thread for the Mod Queue',
         })
         await queueThread.setArchived(false) // unarchived
      }
      client.params.set('queueChannelId', queueThread.id)

      let mailThread = {} // find or create thread for the tidy job
      const mailThreadName = 'Mod Mail'
      const mfindThread = await oplChannel.threads.cache.find(
         (x) => x.name === mailThreadName
      )
      if (mfindThread) {
         mailThread = mfindThread
         if (mailThread.joinable) await mailThread.join()
      } else {
         mailThread = await oplChannel.threads.create({
            name: mailThreadName,
            autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
            joinable: true,
            reason: 'A separate thread for Mod Mail',
         })
         await mailThread.setArchived(false) // unarchived
      }
      client.params.set('mailChannelId', mailThread.id)
   },
}
