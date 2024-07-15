const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js')
// const reddit = require('../modules/Reddit') // shared instance
// const logger = require('../modules/Logger') // shared instance
const scheduler = require('../modules/Scheduler') // shared instance

module.exports = {
   data: new SlashCommandBuilder()
      .setName('slow')
      .setDescription('Activate the slow API schedule')
      .setDMPermission(false)
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
   async execute(interaction) {
      await interaction.reply({
         content: 'Slow command received. Modifying schedule.',
         ephemeral: false,
      })
      scheduler.runJobNow('scheduleSlow')
   },
}
