const config = require('../config')
const logger = require('../modules/Logger')
const { Collection, ThreadAutoArchiveDuration } = require('discord.js')
// const Logger = require('../modules/Logger')
// const logger = new Logger()
let discordServers = {} // temporary. reused when discord server has already been verified
let redditServers = {} // to be stored in client config and used by message-broker
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const verifyDiscordServer = async function (discordServer, redditServerName) {
   if (discordServers[discordServer.id].complete === true) {
      Object.assign(
         redditServers[redditServerName],
         discordServers[discordServer.id]
      )
      // redditServers[redditServerName] = discordServers[discordServer.id]
      //   console.log(
      //      `Discord server: ${discordServer.name} already defined. Reusing for reddit server: ${redditServerName}`
      //   )
   } else {
      currentChannel = await discordServer.channels.cache.find(
         (channel) => channel.name === config.redditChannelName
      )
      if (currentChannel) {
         let fetchedThreads
         try {
            fetchedThreads = await currentChannel.threads.fetch({
               type: 'GUILD_PUBLIC_THREAD',
               // archived: { fetchAll: true },
            })
         } catch (error) {
            console.error(`[${new Date().toLocaleString()}] Error fetching threads:`, error)
         }
         // console.log(fetchedThreads);

         for (const threadName of config.redditThreads) {
            // const findThread = await currentChannel.threads.cache.find(
            //    (x) => x.name === threadName
            // )
            let findThread = fetchedThreads?.threads.find(
               (x) => x.name === threadName
            )

            if (findThread) {
               //    console.log(`${threadName} found - joining`)
               if (findThread.joinable) {
                  await findThread.join()
               }
               // add thread to redditServers
               redditServers[redditServerName][threadName] = findThread.id
               discordServers[discordServer.id][threadName] = findThread.id
            } else {
               logger.info({
                  emoji: '🧵',
                  columns: [
                     'Threads',
                     'Create Missing',
                     discordServer.name,
                     threadName,
                  ],
               })
               try {
                  const createdThread = await currentChannel.threads.create({
                     name: threadName,
                     autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
                     joinable: true,
                     reason: `A separate thread for ${threadName}`,
                  })
                  await createdThread.setArchived(false) // unarchived
                  // add thread to redditServers
                  redditServers[redditServerName][threadName] = createdThread.id
                  discordServers[discordServer.id][threadName] =
                     createdThread.id

                  await delay(2000)
               } catch (error) {
                  console.error(`[${new Date().toLocaleString()}] Error creating thread:`, error)
               }
            }
         }
         discordServers[discordServer.id].discordServerId = discordServer.id
         discordServers[discordServer.id].complete = true
         //  console.log(`Discord server: ${discordServer.name} fully defined.`)
      } else {
         console.error(`[${new Date().toLocaleString()}] Default channel not found:`)
         throw error
      }
   }
}
// Iterate through reddit servers (redditServers) and assign discord channels
// keep track of discord servers (discordServers) that are fully set up to reuse on other servers

module.exports = {
   async execute(client) {
      client.params = new Collection()
      //   client.params.set('redditServers', config.subreddits)
      //   redditServers = client.params.get('redditServers')
      redditServers = config.subreddits
      //   console.log(redditServers)

      for (const redditServerName in redditServers) {
         if (redditServers.hasOwnProperty(redditServerName)) {
            // console.log(
            //    `Verifying Discord server for /r/${redditServerName}:  ${redditServers[redditServerName].discordServerId}`
            // )
            const thisDiscordServer = client.guilds.cache.get(
               redditServers[redditServerName].discordServerId
            )
            if (thisDiscordServer) {
               //bot is a member of the current guild
               //    console.log(`Bot is a member of ${thisDiscordServer.name}`)
               if (!discordServers[thisDiscordServer.id]) {
                  discordServers[thisDiscordServer.id] = {}
               }
               // START FINDING / CREATING CHANNELS AND THREADS
               await verifyDiscordServer(thisDiscordServer, redditServerName)
            } else {
               //    console.log(
               //       `Bot is NOT a member of the specified guild: ${redditServers[redditServerName].discordServerId}. Using default channel.`
               //    )
               redditServers[redditServerName].discordServerId =
                  redditServers['default'].discordServerId
               const defaultDiscordServer = client.guilds.cache.get(
                  redditServers[redditServerName].discordServerId
               )
               // START FINDING / CREATING CHANNELS AND THREADS
               await verifyDiscordServer(defaultDiscordServer, redditServerName)
            }
         }
      }
      // console.log(redditServers)
      // console.log(discordServers)
      client.params.set('redditServers', redditServers)
   },
}
