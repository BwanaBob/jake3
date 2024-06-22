const { Client, GatewayIntentBits } = require('discord.js')
const fs = require('node:fs')
const path = require('node:path')

class Discord {
   constructor(token) {
      this.client = new Client({
         intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            // GatewayIntentBits.MessageContent,
         ],
      })
      this.token = token

      //events handler
      const eventsPath = path.join(__dirname, '../discord-events')
      const eventFiles = fs
         .readdirSync(eventsPath)
         .filter((file) => file.endsWith('.js'))

      for (const file of eventFiles) {
         const filePath = path.join(eventsPath, file)
         const event = require(filePath)
         if (event.once) {
            this.client.once(event.name, (...args) => event.execute(...args))
         } else {
            this.client.on(event.name, (...args) => event.execute(...args))
         }
      }
   }

   async login() {
      await this.client.login(this.token)
      return this.client
   }
}

module.exports = Discord
