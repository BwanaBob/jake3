const { EmbedBuilder } = require('discord.js')
const config = require('../config')
// const getNewComments = require('../jobs/get-new-comments')
// let oplChannelId = ''
// let oplTestingChannelId = ''

module.exports = {
   async sendMessage(client, channelId, message) {
      // console.log(`Sending message from ${source} - ${subreddit}`)
      const channel = await client.channels.cache.get(channelId)
      const sentMessage = await channel.send(message).catch((err) => {
         console.error(`[ERROR] Sending message ${data.id} -`, err.message)
      })
      console.log(`Sent Message: ${sentMessage.id}`)
   },
   async processDiscordMessage(client, jobName, response) {
      // console.log("message broker activated");
      let message = `Job **${jobName}** executed.` // to be replaced
      let sendChannel = ''
      switch (jobName) {
         case 'getTopComments':
            if (response.status == 'success') {
               let embedDescription = ''
               const cotnEmbed = new EmbedBuilder()
                  .setColor(config.jobOutput.cotn.embedColor)
                  .setTitle('COTN Candidates')
               for (const comment of response.data) {
                  embedDescription += `Score ~ ${comment.averageScore.toFixed(
                     2
                  )} [${comment.data.author}](<https://www.reddit.com${
                     comment.data.permalink
                  }>): ${comment.data.body
                     .slice(0, 30)
                     .replace(/(\r?\n|\r|#)/gm, ' ')} \n`
               }
               cotnEmbed.setDescription(embedDescription)
               cotnEmbed.addFields({
                  name: 'Post',
                  value: `[${response.post.id}](<${response.post.url}>) ${response.post.title}`,
               })
               message = { embeds: [cotnEmbed] }
               sendChannel = client.params.get('jobsChannelId')
               this.sendMessage(client, sendChannel, message)
            }
            break
         case 'tidy':
            const tidyEmbed = new EmbedBuilder()
               .setColor(config.jobOutput.tidy.embedColor)
               .setTitle('!tidy Executed')
            if (response.status == 'processed') {
               tidyEmbed.addFields({
                  name: 'Status',
                  value: 'Processed',
                  inline: false,
               })
               tidyEmbed.addFields({
                  name: 'Post Id',
                  value: response.data.id,
                  inline: false,
               })
               tidyEmbed.addFields({
                  name: 'Post Title',
                  value: `[${response.data.title}](${response.data.url})`,
                  inline: false,
               })
               tidyEmbed.setFooter({ text: response.data.subreddit })
            } else {
               tidyEmbed.addFields({
                  name: 'Status',
                  value: 'No Active Live Thread Located',
                  inline: false,
               })
            }
            message = { embeds: [tidyEmbed] }
            sendChannel = client.params.get('jobsChannelId')
            this.sendMessage(client, sendChannel, message)
            break
         case 'getNewComments':
            // if ( response.data.size == 0 ){ break;}
            let thisAvatarURL =
               'https://www.redditstatic.com/avatars/defaults/v2/avatar_default_7.png'
            let p24AvatarURL = 'https://i.imgur.com/TjABABi.png'
            let oplAvatarURL = 'https://i.imgur.com/MbDgRbw.png'
            for (const comment of response.data) {
               // console.log(comment);
               if (
                  comment.subreddit == 'OnPatrolLive' ||
                  comment.subreddit == 'OPLTesting'
               ) {
                  thisAvatarURL = oplAvatarURL
               } else if (comment.subreddit == 'Police247') {
                  thisAvatarURL = p24AvatarURL
               }
               if (comment.author_flair_css_class == 'shadow') {
                  thisAvatarURL = 'https://i.imgur.com/6eRa9QF.png'
                  authorUser += ' [shadow]'
               }
               if (comment.author_flair_css_class == 'watch') {
                  thisAvatarURL = 'https://i.imgur.com/SQ8Yka8.png'
                  authorUser += ' [watch]'
               }
               const newCommentEmbed = new EmbedBuilder()
                  .setColor(config.jobOutput.newComment.embedColor)
                  .setURL(`https://www.reddit.com${comment.permalink}`)
                  .setAuthor({
                     name: comment.author,
                     url: `https://www.reddit.com${comment.permalink}`,
                     iconURL: thisAvatarURL,
                  })
                  .setDescription(
                     `${comment.body.slice(0, config.commentSize)}`
                  )
               message = { embeds: [newCommentEmbed] }
               sendChannel = client.params.get('streamChannelId')
               this.sendMessage(client, sendChannel, message)
            }
            break
         // Add more cases for different job names and their respective formatting
         default:
            message += 'Data:\n'
            message += JSON.stringify(response, null, 2)
            break
      }
   },
}

// module.exports = Broker
// module.exports = { processDiscordMessage, setChannels }
