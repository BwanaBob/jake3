const { Client, GatewayIntentBits, Collection } = require('discord.js')
const Logger = require('./Logger')
const fs = require('node:fs')
const path = require('node:path')

class Discord {
   constructor(token) {
      this.client = new Client({
         intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
      })
      this.token = token
      this.logger = new Logger()
      this.client.commands = new Collection()
      const commandsPath = path.join(__dirname, '../commands')
      const commandFiles = fs
         .readdirSync(commandsPath)
         .filter((file) => file.endsWith('.js'))

      // Slash command Collection setup
      for (const file of commandFiles) {
         const filePath = path.join(commandsPath, file)
         const command = require(filePath)
         // Set a new item in the Collection with the key as the command name and the value as the exported module
         if ('data' in command && 'execute' in command) {
            this.client.commands.set(command.data.name, command)
            const cLoadedDate = new Date().toLocaleString()
            this.logger.info({
               emoji: '💻',
               columns: ['Discord Cmd', 'Loaded', command.data.name],
            })
         } else {
            this.logger.info({
               emoji: '⛔',
               columns: [
                  'Discord Cmd',
                  'Not Loaded',
                  `${filePath} is missing a required "data" or "execute" property.`,
               ],
            })
         }
      }

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
