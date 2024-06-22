const { Events } = require('discord.js')
const Logger = require('../modules/Logger')
const logger = new Logger()

module.exports = {
   name: Events.InteractionCreate,
   async execute(interaction) {
      if (interaction.isChatInputCommand()) {
         const command = interaction.client.commands.get(
            interaction.commandName
         )

         if (!command) {
            console.error(
               `⛔ No command matching ${interaction.commandName} was found.`
            )
            return
         }

         const logDate = new Date(interaction.createdTimestamp).toLocaleString()
         if (!interaction.guild) {
            logger.info({
               emoji: '💻',
               columns: [
                  'Discord Cmd',
                  'Issued (PM)',
                  interaction.user.tag,
                  interaction.commandName,
               ],
            })
         } else {
            logger.info({
               emoji: '💻',
               columns: [
                  'Discord Cmd',
                  'Issued',
                  interaction.guild.name,
                  interaction.channel.name,
                  interaction.member.displayName,
                  interaction.user.tag,
                  interaction.commandName,
               ],
            })
         }

         try {
            await command.execute(interaction)
         } catch (error) {
            console.error(`⛔ Error executing ${interaction.commandName}`)
            console.error(error)
         }
      } else if (interaction.isButton()) {
         // handle buttons here
      }
   },
}
