const { Events, ActivityType, Collection, ThreadAutoArchiveDuration } = require('discord.js')
const Logger = require('../modules/Logger')
const logger = new Logger()

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

      client.guilds.cache.forEach((guild) => {
         logger.info({
            emoji: '💻',
            columns: ['Discord', 'Guild Joined', guild.name, guild.memberCount],
         })
      })

      let discordStatus = {
         status: 'online',
         activities: [
            {
               type: ActivityType.Custom,
               state: "🐾 Doing Jake's job!",
               name: "🐾 Doing Jake's job!",
            },
         ],
      }
      client.user.setPresence(discordStatus);

      // Determine which servers/channels to send messages to
      let oplGuildId = "325206992413130753";
      let testGuildId = "391821567241224192";
      let oplChannelId = ""
      const channelName = "reddit"
      let oplChannel = {};

      const oplGuild = client.guilds.cache.get(oplGuildId)
      const testGuild = client.guilds.cache.get(testGuildId)
      if (oplGuild) { //bot is a member of OPL
         oplChannel = await oplGuild.channels.cache.find(channel => channel.name === channelName);
      } else if (testGuild) {
         oplChannel = await testGuild.channels.cache.find(channel => channel.name === channelName);
      } else {
         console.error("Failed to locate discord channel")
      }

      // console.log(oplChannel.guild.name, oplChannel.name, oplChannel.id);
      client.params = new Collection();
      client.params.set("oplChannelId", oplChannel.id);


      // Turn this into a loop using config items
      let tidyThread = {}; // find or create thread for the tidy job
      const tidyThreadName = "Jobs"
      const tfindThread = await oplChannel.threads.cache.find(
         (x) => x.name === tidyThreadName
      )
      if (tfindThread) {
         tidyThread = tfindThread
         // await sendThread.join()
      } else {
         tidyThread = await oplChannel.threads.create({
            name: tidyThreadName,
            autoArchiveDuration: ThreadAutoArchiveDuration.OneHour,
            joinable: true,
            reason: 'A separate thread for jobs',
         })
      }
      client.params.set("jobsChannelId", tidyThread.id);


      let streamThread = {}; // find or create thread for the tidy job
      const streamThreadName = "Stream"
      const sfindThread = await oplChannel.threads.cache.find(
         (x) => x.name === streamThreadName
      )
      if (sfindThread) {
         streamThread = sfindThread
         // await sendThread.join()
      } else {
         streamThread = await oplChannel.threads.create({
            name: streamThreadName,
            autoArchiveDuration: ThreadAutoArchiveDuration.OneHour,
            joinable: true,
            reason: 'A separate thread for the stream',
         })
      }
      client.params.set("streamChannelId", streamThread.id);


      let queueThread = {}; // find or create thread for the tidy job
      const queueThreadName = "Mod Queue"
      const qfindThread = await oplChannel.threads.cache.find(
         (x) => x.name === queueThreadName
      )
      if (qfindThread) {
         queueThread = qfindThread
         // await sendThread.join()
      } else {
         queueThread = await oplChannel.threads.create({
            name: queueThreadName,
            autoArchiveDuration: ThreadAutoArchiveDuration.OneHour,
            joinable: true,
            reason: 'A separate thread for the Mod Queue',
         })
      }
      client.params.set("queueChannelId", queueThread.id);


      let mailThread = {}; // find or create thread for the tidy job
      const mailThreadName = "Mod Mail"
      const mfindThread = await oplChannel.threads.cache.find(
         (x) => x.name === mailThreadName
      )
      if (mfindThread) {
         mailThread = mfindThread
         // await sendThread.join()
      } else {
         mailThread = await oplChannel.threads.create({
            name: mailThreadName,
            autoArchiveDuration: ThreadAutoArchiveDuration.OneHour,
            joinable: true,
            reason: 'A separate thread for Mod Mail',
         })
      }
      client.params.set("mailChannelId", mailThread.id);

   },
}
