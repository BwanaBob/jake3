const { EmbedBuilder } = require('discord.js')
const config = require('../config')

module.exports = {
   _makePostEmbed(post) {
      let thisAvatarURL =
         'https://www.redditstatic.com/avatars/defaults/v2/avatar_default_7.png'
      let p24AvatarURL = 'https://i.imgur.com/TjABABi.png'
      let oplAvatarURL = 'https://i.imgur.com/MbDgRbw.png'
      let postMessage = ''
      let authorUser = post.author

      if (post.subreddit == 'OnPatrolLive') {
         thisAvatarURL = oplAvatarURL
      } else if (
         post.subreddit == 'Police247' ||
         post.subreddit == 'OPLTesting'
      ) {
         thisAvatarURL = p24AvatarURL
      }

      const postEmbed = new EmbedBuilder()
         .setColor(config.jobOutput.newPost.embedColor)
         .setURL(`https://www.reddit.com${post.permalink}`)
         .setAuthor({
            name: authorUser,
            url: `https://www.reddit.com${post.permalink}`,
            iconURL: thisAvatarURL,
         })

      if (post.author_flair_css_class == 'shadow') {
         // console.log('User is shadowed')
         thisAvatarURL = 'https://i.imgur.com/6eRa9QF.png'
         authorUser += ' [shadow]'
         postEmbed.setColor(config.jobOutput.spamPost.embedColor)
      }
      if (post.author_flair_css_class == 'watch') {
         thisAvatarURL = 'https://i.imgur.com/SQ8Yka8.png'
         authorUser += ' [watch]'
         postEmbed.setColor(config.jobOutput.modQueuePost.embedColor)
      }

      postMessage = `**${post.title.slice(0, config.postSize)}**`
      if (post.selftext) {
         postMessage += `\n${post.selftext.slice(0, config.postSize)}`
      }

      var postEmoji = '📌'
      if (!post.is_self) {
         postEmoji = '🔗'
         if (post.post_hint !== 'image') {
            postMessage += `\n[Link](${post.url})`
         }
      }
      if (post.post_hint == 'rich:video' || post.is_video == true) {
         postEmoji = '🎦'
      }
      if (post.post_hint == 'image') {
         postEmoji = '📸'
         postEmbed.setImage(post.url)
      }
      if (post.poll_data) {
         postEmoji = '✅'
      }

      if (
         post.thumbnail &&
         post.thumbnail !== 'default' &&
         post.thumbnail !== 'self' &&
         post.thumbnail !== 'nsfw' &&
         post.post_hint !== 'image'
      ) {
         try {
            postEmbed.setThumbnail(post.thumbnail)
         } catch (err) {
            console.error(
               `[ERROR] Setting Thumbnail ${post.thumbnail} -`,
               err.message
            )
         }
      }

      postEmbed.setDescription(`${postEmoji}  ${postMessage}`)

      if (
         post.banned_at_utc &&
         (post.author_flair_css_class == 'shadow' || post.spam)
      ) {
         postEmbed.setColor(config.jobOutput.spamPost.embedColor)
         postEmbed.setTitle('Spam Post')
         postEmbed.setURL(`https://www.reddit.com/r/OnPatrolLive/about/spam`)
         return postEmbed
      }

      if (post.banned_at_utc) {
         // console.log('Comment is in queue')
         if (post.num_reports && post.num_reports > 0) {
            postEmbed.setColor(config.jobOutput.reportedPost.embedColor)
            postEmbed.setTitle('Reported Post')
         } else {
            postEmbed.setColor(config.jobOutput.modQueuePost.embedColor)
            postEmbed.setTitle('Mod Queue Post')
         }
         postEmbed.setURL(`https://www.reddit.com/mod/${post.subreddit}/queue`)
      }
      return postEmbed
   },

   _makeCommentEmbed(comment) {
      // console.log(comment);
      let thisAvatarURL =
         'https://www.redditstatic.com/avatars/defaults/v2/avatar_default_7.png'
      let p24AvatarURL = 'https://i.imgur.com/TjABABi.png'
      let oplAvatarURL = 'https://i.imgur.com/MbDgRbw.png'
      let authorUser = comment.author

      if (comment.subreddit == 'OnPatrolLive') {
         thisAvatarURL = oplAvatarURL
      } else if (
         comment.subreddit == 'Police247' ||
         comment.subreddit == 'OPLTesting'
      ) {
         thisAvatarURL = p24AvatarURL
      }

      const commentEmbed = new EmbedBuilder()
         .setColor(config.jobOutput.newComment.embedColor)
         .setURL(`https://www.reddit.com${comment.permalink}`)
         .setAuthor({
            name: authorUser,
            url: `https://www.reddit.com${comment.permalink}`,
            iconURL: thisAvatarURL,
         })
         .setDescription(`${comment.body.slice(0, config.commentSize)}`)

      if (comment.author_flair_css_class == 'shadow') {
         // console.log('User is shadowed')
         thisAvatarURL = 'https://i.imgur.com/6eRa9QF.png'
         authorUser += ' [shadow]'
         commentEmbed.setColor(config.jobOutput.spamComment.embedColor)
      }

      if (comment.author_flair_css_class == 'watch') {
         // console.log('User is on watchlist')
         thisAvatarURL = 'https://i.imgur.com/SQ8Yka8.png'
         authorUser += ' [watch]'
         commentEmbed.setColor(config.jobOutput.modQueueComment.embedColor)
      }

      if (
         comment.banned_at_utc &&
         (comment.author_flair_css_class == 'shadow' ||
            comment.spam ||
            comment.body == '!tidy')
      ) {
         // console.log('Comment is spam')
         commentEmbed.setColor(config.jobOutput.spamComment.embedColor)
         return commentEmbed
      }

      if (comment.banned_at_utc) {
         // console.log('Comment is in queue')
         if (comment.num_reports && !comment.num_reports === 0) {
            commentEmbed.setColor(config.jobOutput.reportedComment.embedColor)
            commentEmbed.setTitle('Reported Comment')
            // console.log('Comment is in reported')
         } else {
            commentEmbed.setColor(config.jobOutput.modQueueComment.embedColor)
            commentEmbed.setTitle('Mod Queue Comment')
            // console.log('Comment is just in queue')
         }
         commentEmbed.setURL(
            `https://www.reddit.com/mod/${comment.subreddit}/queue`
         )
      }
      return commentEmbed
   },
   async sendMessage(client, channelId, message) {
      // console.log(`Sending message from ${source} - ${subreddit}`)
      const channel = await client.channels.cache.get(channelId)
      const sentMessage = await channel.send(message).catch((err) => {
         console.error(`[ERROR] Sending message ${data.id} -`, err.message)
      })
      // console.log(`Sent Message: ${sentMessage.id}`)
   },
   async processDiscordMessage(client, jobName, response) {
      // console.log("message broker activated");
      let message = `Job **${jobName}** executed.` // to be replaced
      // console.log(jobName, response.status)
      // console.log(response.data)
      let sendChannel = ''
      switch (jobName) {
         case 'getNewModQueue':
            if (response.status == 'success') {
               let messageEmbed = ''
               for (const item of response.data) {
                  if (item.kind == 't3') {
                     messageEmbed = this._makePostEmbed(item.data)
                  } else if (item.kind == 't1') {
                     messageEmbed = this._makeCommentEmbed(item.data)
                  } else {
                     break
                  }
                  const modPing = '1171955876609937564'
                  message = {
                     embeds: [messageEmbed],
                     content: `<@&${modPing}>`,
                  }
                  sendChannel = client.params.get('queueChannelId')
                  this.sendMessage(client, sendChannel, message)
               }
            }
            break
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
                  value: `[${response.post.id}](<${response.post.url}?sort=top>) ${response.post.title}`,
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
               // tidyEmbed.addFields({
               //    name: 'Post Id',
               //    value: response.data.id,
               //    inline: false,
               // })
               tidyEmbed.addFields({
                  name: 'Post Title',
                  value: `[${response.data.title}](${response.data.url})`,
                  inline: false,
               })
               tidyEmbed.setFooter({ text: `r/${response.data.subreddit}` })
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
            if (response.status == 'success') {
               let messageEmbed = ''
               for (const comment of response.data) {
                  messageEmbed = this._makeCommentEmbed(comment)
                  message = { embeds: [messageEmbed] }
                  sendChannel = client.params.get('streamChannelId')
                  this.sendMessage(client, sendChannel, message)
               }
            }
            break
         case 'getNewPosts':
            if (response.status == 'success') {
               let messageEmbed = ''
               for (const post of response.data) {
                  messageEmbed = this._makePostEmbed(post)
                  message = { embeds: [messageEmbed] }
                  sendChannel = client.params.get('streamChannelId')
                  this.sendMessage(client, sendChannel, message)
               }
            }
            break
         case 'getNewModMail':
            if (response.status == 'success') {
               for (const mailMessage of response.data) {
                  const messageEmbed = new EmbedBuilder()
                     .setColor(config.jobOutput.modMail.embedColor)
                     .setTitle('Mod Mail')
                     .setURL(`https://mod.reddit.com/mail/all`)
                     .setAuthor({
                        name: mailMessage.author.name,
                        iconURL: 'https://i.imgur.com/MbDgRbw.png',
                     })
                     .setDescription(
                        `${
                           mailMessage.bodyMarkdown.slice(0, config.commentSize)
                           // .replace(/(\r?\n|\r|#)/gm)
                        }`
                     )
                  const modPing = '1171955876609937564'
                  message = {
                     embeds: [messageEmbed],
                     content: `<@&${modPing}>`,
                  }
                  sendChannel = client.params.get('mailChannelId')
                  this.sendMessage(client, sendChannel, message)
               }
            }
         // Add more cases for different job names and their respective formatting
         default:
            message += 'Data:\n'
            message += JSON.stringify(response, null, 2)
            break
      }
   },
}
