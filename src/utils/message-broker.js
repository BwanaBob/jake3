const { EmbedBuilder, MessageFlagsBitField } = require('discord.js')
const config = require('../config')

module.exports = {
   _getPostStatus(post) {
      // not yet used
      if (!post.banned_at_utc) {
         return { status: 'Visible', subStatus: 'Visible' }
      }

      if (post.spam) {
         return { status: 'Removed', subStatus: 'Spam' }
      }

      if (
         post.banned_at_utc &&
         !post.ban_note &&
         post.banned_by &&
         post.banned_by == 'true' &&
         post.removed_by_category == 'reddit'
      ) {
         return { status: 'Queued', subStatus: 'Reddit' }
      }

      // if (
      //    post.banned_at_utc &&
      //    post.ban_note &&
      //    post.ban_note == 'comfirm spam' &&
      //    post.banned_by &&
      //    post.banned_by == 'AutoModerator'
      // ) {
      //    return { status: 'Queued', subStatus: 'Automoderator ' } // this is on a comment karma one
      // }

      if (
         post.banned_at_utc &&
         post.ban_note &&
         post.ban_note == 'remove not spam' &&
         post.banned_by &&
         post.banned_by == 'AutoModerator' &&
         author_flair_css_class == 'shadow'
      ) {
         return { status: 'Removed', subStatus: 'ShadowBanned' }
      }

      if (
         post.banned_at_utc &&
         post.ban_note &&
         post.ban_note == 'remove not spam' &&
         post.banned_by &&
         post.banned_by == 'AutoModerator'
      ) {
         return { status: 'Queued', subStatus: 'AutoModerator' }
      }

      if (post.num_reports && post.num_reports > 0) {
         return { status: 'Queued', subStatus: 'Reported' }
      }

      return { status: 'Unknown', subStatus: 'Unknown' }
   },

   _makePostEmbed(post) {
      let thisAvatarURL =
         'https://www.redditstatic.com/avatars/defaults/v2/avatar_default_7.png'
      let p24AvatarURL = 'https://i.imgur.com/TjABABi.png'
      let oplAvatarURL = 'https://i.imgur.com/MbDgRbw.png'
      let postMessage = ''
      let authorUser = post.author

      if (post.subreddit == 'OnPatrolLive' || post.subreddit == 'OPLTesting') {
         thisAvatarURL = oplAvatarURL
      } else if (post.subreddit == 'Police247') {
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

      if (post.ban_note && post.ban_note !== 'remove not spam') {
         postEmbed.addFields({
            name: 'Ban Note',
            value: post.ban_note,
            inline: true,
         })
      }

      if (post.banned_by && post.banned_by !== 'AutoModerator') {
         postEmbed.addFields({
            name: 'Banned By',
            value: post.banned_by,
            inline: true,
         })
      }

      if (post.removed_by_category) {
         postEmbed.addFields({
            name: 'Removed By Category',
            value: post.removed_by_category,
            inline: true,
         })
      }

      if (post.collapsed_reason_code) {
         postEmbed.addFields({
            name: 'Reason Code',
            value: post.collapsed_reason_code,
            inline: true,
         })
      }

      if (post.banned_at_utc && post.spam) {
         postEmbed.setColor(config.jobOutput.spamPost.embedColor)
         postEmbed.setTitle('Spam Post')
         postEmbed.setURL(`https://www.reddit.com/r/OnPatrolLive/about/spam`)
         return postEmbed
      }

      if (
         post.banned_at_utc &&
         (post.author_flair_css_class == 'shadow' ||
            (post.ban_note && post.ban_note !== 'remove not spam'))
      ) {
         postEmbed.setColor(config.jobOutput.spamPost.embedColor)
         postEmbed.setTitle('Removed Post')
         postEmbed.setURL(
            `https://www.reddit.com/mod/OnPatrolLive/queue?dx_mod_queue=enabled&queueType=removed&contentType=all&sort=sort_date&page=1&first=25&selectedSubreddits=OnPatrolLive`
         )
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
         // .setTitle(`${comment.link_title.slice(0,config.commentTitleSize)}`)
         .setFooter({
             text: `${comment.link_title.slice(0,config.commentTitleSize)}`
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

      if (comment.ban_note && comment.ban_note !== 'remove not spam') {
         // commentEmbed.setFooter({ text: `Ban note: ${comment.ban_note}` });
         commentEmbed.addFields({
            name: 'Ban Note',
            value: comment.ban_note,
            inline: true,
         })
      }

      if (comment.banned_by && comment.banned_by !== 'AutoModerator') {
         commentEmbed.addFields({
            name: 'Banned By',
            value: comment.banned_by,
            inline: true,
         })
      }

      if (comment.collapsed_reason_code) {
         commentEmbed.addFields({
            name: 'Reason Code',
            value: comment.collapsed_reason_code,
            inline: true,
         })
      }

      if (comment.banned_at_utc && comment.spam) {
         // console.log('Comment is spam')
         commentEmbed.setColor(config.jobOutput.spamComment.embedColor)
         // commentEmbed.setTitle(`[Spam] ${comment.link_title.slice(0,config.commentTitleSize)}`)
         commentEmbed.setTitle(`Spam Comment`)
         commentEmbed.setURL(`https://www.reddit.com/r/OnPatrolLive/about/spam`)
         return commentEmbed
      }

      if (
         comment.banned_at_utc &&
         (comment.author_flair_css_class == 'shadow' ||
            (comment.ban_note && comment.ban_note !== 'remove not spam') ||
            comment.body == '!tidy')
      ) {
         // console.log('Comment is spam')
         commentEmbed.setColor(config.jobOutput.spamComment.embedColor)
         // commentEmbed.setTitle(`[Removed] ${comment.link_title.slice(0,config.commentTitleSize)}`)
         commentEmbed.setTitle(`Removed Comment`)
         commentEmbed.setURL(
            `https://www.reddit.com/mod/OnPatrolLive/queue?dx_mod_queue=enabled&queueType=removed&contentType=all&sort=sort_date&page=1&first=25&selectedSubreddits=OnPatrolLive`
         )
         return commentEmbed
      }

      if (comment.banned_at_utc) {
         // console.log('Comment is in queue')
         if (comment.num_reports && comment.num_reports > 0) {
            commentEmbed.setColor(config.jobOutput.reportedComment.embedColor)
            commentEmbed.setTitle('Reported Comment')
            // console.log('Comment is in reported')
         } else {
            commentEmbed.setColor(config.jobOutput.modQueueComment.embedColor)
            // commentEmbed.setTitle(`[Queue] ${comment.link_title.slice(0,config.commentTitleSize)}`)
            commentEmbed.setTitle(`Queued Comment`)
         }
         commentEmbed.setURL(
            `https://www.reddit.com/mod/${comment.subreddit}/queue`
         )
      }
      return commentEmbed
   },

   // // original sendMessage
   // async sendMessage(client, channelId, message) {
   //    // console.log(`Sending message from ${source} - ${subreddit}`)
   //    const channel = await client.channels.cache.get(channelId)
   //    const sentMessage = await channel.send(message).catch((err) => {
   //       console.error(`[ERROR] Sending message ${data.id} -`, err.message)
   //    })
   //    // console.log(`Sent Message: ${sentMessage.id}`)
   // },

   async sendMessage(client, channelId, message) {
      const { start, end } = config.quietHours

      const currentTime = new Date()
      const startTime = new Date()
      const endTime = new Date()

      // Set startTime and endTime
      const [startHour, startMinute] = start.split(':').map(Number)
      const [endHour, endMinute] = end.split(':').map(Number)
      startTime.setHours(startHour, startMinute, 0, 0)
      endTime.setHours(endHour, endMinute, 0, 0)

      // If end time is earlier in the day than start time (e.g., quiet period spans midnight)
      if (endTime < startTime) {
         if (currentTime < endTime) {
            startTime.setDate(startTime.getDate() - 1) // Set start time to yesterday
         } else {
            endTime.setDate(endTime.getDate() + 1) // Set end time to tomorrow
         }
      }

      // Check if current time is within quiet hours
      if (currentTime >= startTime && currentTime <= endTime) {
         message.flags = [MessageFlagsBitField.Flags.SuppressNotifications]
      }

      const channel = await client.channels.cache.get(channelId)
      if (!channel) {
         console.error(`[ERROR] Channel ${channelId} not found`)
         return
      }

      try {
         const sentMessage = await channel.send(message)
         // console.log(sentMessage);
      } catch (error) {
         console.error(`[ERROR] Sending message -`, error)
      }
   },

   async processDiscordMessage(client, jobName, response) {
      // console.log("message broker activated");
      let message = `Job **${jobName}** executed.` // to be replaced
      // console.log(jobName, response.status)
      // console.log(response.data)
      const redditServers = client.params.get('redditServers')
      // console.log(redditServers);

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
                  message = {
                     embeds: [messageEmbed],
                  }
                  // const modPing = '1171955876609937564'
                  const modPing = redditServers[item.data.subreddit]?.notifyRole
                  if (modPing) {
                     message.content = `<@&${modPing}>`
                  }

                  sendChannel = redditServers[item.data.subreddit]['Mod Queue']
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
                  sendChannel = redditServers[comment.subreddit]['Stream']
                  // sendChannel = client.params.get('streamChannelId')
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
                  sendChannel = redditServers[post.subreddit]['Stream']
                  // sendChannel = client.params.get('streamChannelId')
                  this.sendMessage(client, sendChannel, message)
               }
            }
            break
         case 'getNewModMail':
            if (response.status == 'success') {
               for (const mailMessage of response.data) {
                  const messageEmbed = new EmbedBuilder()
                     .setColor(config.jobOutput.modMail.embedColor)
                     .setTitle(mailMessage.parentSubject || 'Mod Mail')
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
                     .setFooter({
                        text: `r/${mailMessage.parentOwnerDisplayName}`,
                     })

                  message = {
                     embeds: [messageEmbed],
                  }
                  // const modPing = '1171955876609937564'
                  const modPing =
                     redditServers[mailMessage.parentOwnerDisplayName]
                        ?.notifyRole
                  if (modPing) {
                     message.content = `<@&${modPing}>`
                  }

                  // console.log(mailMessage)
                  if (mailMessage.parentOwnerType == 'subreddit') {
                     sendChannel =
                        redditServers[mailMessage.parentOwnerDisplayName][
                           'Mod Mail'
                        ]
                  } else {
                     sendChannel = client.params.get('mailChannelId')
                  }
                  this.sendMessage(client, sendChannel, message)
               }
            }
            break
         case 'getModLogStats':
            if (response.status == 'success') {
               // console.log(response.data)
               // console.log('getModLogStats ran')
               let statsDetail = ''
               for (const [ruleDetail, counts] of response.data) {
                  const total = counts.approved + counts.removed
                  const approvedPercentage = (counts.approved / total) * 100
                  const removedPercentage = (counts.removed / total) * 100
                  statsDetail += `${counts.ruleCount} | ✅ ${
                     counts.approved
                  } (${approvedPercentage.toFixed(1)}%) | ⛔ ${
                     counts.removed
                  } (${removedPercentage.toFixed(1)}%) | ${ruleDetail}\n`
               }

               const statsEmbed = new EmbedBuilder()
                  .setColor(config.jobOutput.modLogStats.embedColor)
                  .setTitle('Mod Log Stats')
                  // .setURL(`https://mod.reddit.com/mail/all`)
                  // .setAuthor({
                  //    name: mailMessage.author.name,
                  //    iconURL: 'https://i.imgur.com/MbDgRbw.png',
                  // })
                  .setDescription(`\`\`\`${statsDetail}\`\`\``)
               // .setFooter({
               //    text: `r/${mailMessage.parentOwnerDisplayName}`,
               // })

               message = { embeds: [statsEmbed] }
               sendChannel = redditServers['Default']['Jobs']
               // sendChannel = client.params.get('jobsChannelId')
               this.sendMessage(client, sendChannel, message)
            }
            break
         // Add more cases for different job names and their respective formatting
         default:
            console.log('Message Broker: Unable to identify message')
            break
      }
   },
}
