const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js')
// const reddit = require('../modules/Reddit') // shared instance
// const logger = require('../modules/Logger') // shared instance
const scheduler = require('../modules/Scheduler') // shared instance

module.exports = {
   data: new SlashCommandBuilder()
      .setName('cotn')
      .setDescription('Returns the top comments for a post')
      .setDMPermission(false)
      .setDefaultMemberPermissions(PermissionFlagsBits.MentionEveryone)
      .addStringOption((option) =>
         option
            .setName('postid')
            .setDescription('The post Id (leave blank for latest post)')
            .setRequired(false)
      ),
   async execute(interaction) {
      const postId = interaction.options.getString('postid')
      await interaction.reply({
         content: postId
            ? `CotN Command Received. Executing Job for postId: ${postId}`
            : 'CotN Command Received. Executing Job for latest post',
         ephemeral: false,
      })
      scheduler.runJobNow('getTopComments', postId ? { postId } : {})
   },
}
