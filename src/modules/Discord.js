const { Client, GatewayIntentBits } = require('discord.js');

class Discord {
  constructor(token) {
    this.client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
    this.token = token;
  }

  async login() {
    await this.client.login(this.token);
    return this.client;
  }
}

module.exports = Discord;
