const { Events, ActivityType } = require('discord.js')
const Logger = require('../modules/Logger')
const logger = new Logger()

module.exports = {
   name: Events.ClientReady,
   once: true,
   execute(client) {
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
      client.user.setPresence(discordStatus)
   },
}
