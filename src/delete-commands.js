// https://discordjs.guide/slash-commands/deleting-commands.html#deleting-all-commands
const { REST, Routes } = require("discord.js");
const { discordToken, discordClientId, discordCommandGuildId } = require('./config')
const rest = new REST({ version: "10" }).setToken(discordToken);

// for guild-based commands
rest
  .put(Routes.applicationGuildCommands(discordClientId, discordCommandGuildId), { body: [] })
  .then(() => console.log("Successfully deleted all guild commands."))
  .catch(console.error);

// for global commands
rest
  .put(Routes.applicationCommands(discordClientId), { body: [] })
  .then(() => console.log("Successfully deleted all application commands."))
  .catch(console.error);