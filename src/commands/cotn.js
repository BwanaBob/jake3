const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("cotn")
    .setDescription("Returns the top comments for a post")
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption(option =>
      option.setName('postid')
        .setDescription('The post Id')
        .setRequired(true)
      ),
    async execute(interaction) {
    await interaction.reply({ content: "Command Received. Doing nothing (yet)", ephemeral: true });
  },
};