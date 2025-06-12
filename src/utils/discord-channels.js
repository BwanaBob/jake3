const config = require('../config')
const logger = require('../modules/Logger')
const { Collection, ThreadAutoArchiveDuration } = require('discord.js')
const threadPersistence = require('./discord-threads')
let discordServers = {} // temporary. reused when discord server has already been verified
let redditServers = {} // to be stored in client config and used by message-broker
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
let threadIds = threadPersistence.loadThreadIds()

const verifyDiscordServer = async function (discordServer, redditServerName) {
   if (discordServers[discordServer.id].complete === true) {
      Object.assign(
         redditServers[redditServerName],
         discordServers[discordServer.id]
      )
   } else {
      currentChannel = await discordServer.channels.cache.find(
         (channel) => channel.name === config.redditChannelName
      )
      if (currentChannel) {
         let fetchedThreads
         try {
            fetchedThreads = await currentChannel.threads.fetch({
               type: 'GUILD_PUBLIC_THREAD',
            })
         } catch (error) {
            console.error(`[${new Date().toLocaleString()}] Error fetching threads:`, error)
         }
         for (const threadName of config.redditThreads) {
            let findThread = null
            // Try to get threadId from persisted file
            let persistedId = threadIds[redditServerName]?.[threadName]
            if (persistedId) {
               try {
                  findThread = await currentChannel.threads.fetch(persistedId)
               } catch (e) {
                  findThread = null
               }
            }
            // Fallback: search by name in fetched threads
            if (!findThread) {
               findThread = fetchedThreads?.threads.find(
                  (x) => x.name === threadName
               )
            }
            if (findThread) {
               if (findThread.joinable) {
                  await findThread.join()
               }
               redditServers[redditServerName][threadName] = findThread.id
               discordServers[discordServer.id][threadName] = findThread.id
               // Persist the thread ID
               if (!threadIds[redditServerName]) threadIds[redditServerName] = {}
               threadIds[redditServerName][threadName] = findThread.id
               threadPersistence.saveThreadIds(threadIds)
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
                  await createdThread.setArchived(false)
                  redditServers[redditServerName][threadName] = createdThread.id
                  discordServers[discordServer.id][threadName] = createdThread.id
                  if (!threadIds[redditServerName])
                     threadIds[redditServerName] = {}
                  threadIds[redditServerName][threadName] = createdThread.id
                  threadPersistence.saveThreadIds(threadIds)
                  await delay(2000)
               } catch (error) {
                  console.error(`[${new Date().toLocaleString()}] Error creating thread:`, error)
               }
            }
         }
         discordServers[discordServer.id].discordServerId = discordServer.id
         discordServers[discordServer.id].complete = true
      } else {
         console.error(`[${new Date().toLocaleString()}] Default channel not found:`)
         throw new Error('Default channel not found')
      }
   }
}
// Iterate through reddit servers (redditServers) and assign discord channels
// keep track of discord servers (discordServers) that are fully set up to reuse on other servers

module.exports = {
   async execute(client) {
      client.params = new Collection()
      redditServers = config.subreddits

      for (const redditServerName in redditServers) {
         if (redditServers.hasOwnProperty(redditServerName)) {
            const thisDiscordServer = client.guilds.cache.get(
               redditServers[redditServerName].discordServerId
            )
            if (thisDiscordServer) {
               if (!discordServers[thisDiscordServer.id]) {
                  discordServers[thisDiscordServer.id] = {}
               }
               await verifyDiscordServer(thisDiscordServer, redditServerName)
            } else {
               redditServers[redditServerName].discordServerId =
                  redditServers['default'].discordServerId
               const defaultDiscordServer = client.guilds.cache.get(
                  redditServers[redditServerName].discordServerId
               )
               await verifyDiscordServer(defaultDiscordServer, redditServerName)
            }
         }
      }
      client.params.set('redditServers', redditServers)
   },
}
