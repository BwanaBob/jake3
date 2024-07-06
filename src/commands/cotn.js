const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js')
// const reddit = require('../modules/Reddit') // shared instance
// const logger = require('../modules/Logger') // shared instance
const scheduler = require('../modules/Scheduler') // shared instance

module.exports = {
   data: new SlashCommandBuilder()
      .setName('cotn')
      .setDescription('Returns the top comments for a post')
      .setDMPermission(false)
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
      .addStringOption((option) =>
         option
            .setName('postid')
            .setDescription('The post Id')
            .setRequired(true)
      ),
   async execute(interaction) {
      await interaction.reply({
         content: 'CotN Command Received. Executing Job',
         ephemeral: false,
      })
      scheduler.runJobNow('getTopComments')
   },
}
