const { EmbedBuilder, MessageFlagsBitField } = require('discord.js')
const config = require('../config')

module.exports = {
   _getSubmissionAvatar(submission) {
      let thisAvatarURL =
         'https://www.redditstatic.com/avatars/defaults/v2/avatar_default_7.png'
      let p24AvatarURL = 'https://i.imgur.com/TjABABi.png'
      let oplAvatarURL = 'https://i.imgur.com/MbDgRbw.png'
      let lafrAvatarURL = 'https://i.imgur.com/puXsvy4.jpg'

      if (
         submission.subreddit == 'OnPatrolLive' ||
         submission.subreddit == 'OPLTesting'
      ) {
         thisAvatarURL = oplAvatarURL
      } else if (submission.subreddit == 'Police247') {
         thisAvatarURL = p24AvatarURL
      } else if (
         submission.subreddit == 'LAFireandRescue' ||
         submission.subreddit == 'LAFireRescue'
      ) {
         thisAvatarURL = lafrAvatarURL
      }
      return thisAvatarURL
   },

   _getPostEmoji(post) {
      var postEmoji = '📌'
      if (!post.is_self) {
         postEmoji = '🔗'
      }
      if (post.post_hint == 'rich:video' || post.is_video == true) {
         postEmoji = '🎦'
      }
      if (post.post_hint == 'image') {
         postEmoji = '📸'
         // postEmbed.setImage(post.url)
      }
      if (post.poll_data) {
         postEmoji = '✅'
      }
      return postEmoji
   },

   _getPostEmbed(post, jobName) {
      // Create initial embed
      const postEmbed = new EmbedBuilder()
      // Get server based avatar image
      thisAvatarURL = this._getSubmissionAvatar(post)
      postEmbed.setAuthor({
         name: post.author,
         url: `https://www.reddit.com${post.permalink}`,
         iconURL: thisAvatarURL,
      })
      // Handle special formatting based on post type
      //    post Emoji for title based on post type
      const postEmoji = this._getPostEmoji(post)
      //    post description
      let postMessage = `**${post.title.slice(0, config.postSize)}**`
      if (post.selftext) {
         postMessage += `\n${post.selftext.slice(0, config.postSize)}`
      }
      if (!post.is_self && post.post_hint !== 'image') {
         postMessage += `\n[Link](${post.url})`
      }
      postEmbed.setDescription(`${postEmoji}  ${postMessage}`)
      //    post image
      if (post.post_hint == 'image') {
         postEmbed.setImage(post.url)
      }
      //    post thumbnail
      if (
         post.thumbnail &&
         post.thumbnail !== 'default' &&
         post.thumbnail !== 'self' &&
         post.thumbnail !== 'spoiler' &&
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
      // end of post type based formatting

      // Get visibility status and format accordingly
      if (!post.banned_at_utc && jobName !== 'getNewModQueue') {
         postEmbed.setColor(config.jobOutput.newPost.embedColor)
         // postEmbed.setFooter({ text: `` })
         return postEmbed
      }

      if (post.banned_at_utc && post.spam) {
         // Never seen this
         postEmbed.setColor(config.jobOutput.spamPost.embedColor)
         postEmbed.setTitle('Spam Post')
         postEmbed.setURL(
            `https://www.reddit.com/mod/${post.subreddit}/queue?dx_mod_queue=enabled&queueType=removed`
         )
         postEmbed.setFooter({ text: `Unusual Spam Post - Leave for analysis` })
         return postEmbed
      }

      if (
         post.banned_at_utc &&
         !post.ban_note &&
         post.banned_by &&
         post.banned_by === true &&
         post.removed_by_category == 'reddit'
      ) {
         postEmbed.setColor(config.jobOutput.spamPost.embedColor)
         postEmbed.setTitle('Removed Post')
         postEmbed.setURL(
            `https://www.reddit.com/mod/${post.subreddit}/queue?dx_mod_queue=enabled&queueType=removed`
         )
         postEmbed.setFooter({ text: `Reddit Spam Post - Uncommon` })
         return postEmbed
      }

      if (
         post.banned_at_utc &&
         post.ban_note &&
         post.ban_note == 'reinforce spam' &&
         post.banned_by &&
         post.banned_by === true &&
         post.removed_by_category &&
         post.removed_by_category == 'reddit'
      ) {
         // "Removed by Reddit's spam filter"
         postEmbed.setColor(config.jobOutput.modQueuePost.embedColor)
         postEmbed.setTitle('Queued Post')
         postEmbed.setURL(`https://www.reddit.com/mod/${post.subreddit}/queue`)
         postEmbed.setFooter({
            text: `Queued by Subreddit Settings (All Posts)`,
         })
         return postEmbed
      }

      // if (
      //    post.banned_at_utc &&
      //    post.ban_note &&
      //    post.ban_note == 'comfirm spam' &&
      //    post.banned_by &&
      //    post.banned_by == 'AutoModerator'
      // ) {
      //    return { status: 'Queued', subStatus: 'Automoderator ' } // this is on a comment karma one. Likely both automod and reddit reputation filtered
      // }

      if (
         post.banned_at_utc &&
         post.ban_note &&
         post.ban_note == 'remove not spam' &&
         post.banned_by &&
         post.banned_by == 'AutoModerator' &&
         post.author_flair_css_class == 'shadow'
      ) {
         postEmbed.setColor(config.jobOutput.spamPost.embedColor)
         postEmbed.setTitle('Removed Post')
         postEmbed.setURL(
            `https://www.reddit.com/mod/${post.subreddit}/queue?dx_mod_queue=enabled&queueType=removed`
         )
         postEmbed.setFooter({ text: `ShadowBanned by AutoModerator` })
         return postEmbed
      }

      if (
         post.banned_at_utc &&
         post.ban_note &&
         post.ban_note == 'remove not spam' &&
         post.banned_by &&
         post.banned_by == 'AutoModerator' &&
         post.author_flair_css_class == 'watch'
      ) {
         postEmbed.setColor(config.jobOutput.modQueuePost.embedColor)
         postEmbed.setTitle('Queued Post')
         postEmbed.setURL(`https://www.reddit.com/mod/${post.subreddit}/queue`)
         postEmbed.setFooter({ text: `Watch List by AutoModerator` })
         return postEmbed
      }

      if (
         post.banned_at_utc &&
         post.ban_note &&
         post.ban_note == 'remove not spam' &&
         post.banned_by &&
         post.banned_by == 'AutoModerator'
      ) {
         postEmbed.setColor(config.jobOutput.modQueuePost.embedColor)
         postEmbed.setTitle('Queued Post')
         postEmbed.setURL(`https://www.reddit.com/mod/${post.subreddit}/queue`)
         postEmbed.setFooter({ text: `Filtered by AutoModerator` })
         return postEmbed
      }

      if (post.num_reports && post.num_reports > 0) {
         postEmbed.setColor(config.jobOutput.modQueuePost.embedColor)
         postEmbed.setTitle('Queued Post')
         postEmbed.setURL(`https://www.reddit.com/mod/${post.subreddit}/queue`)
         postEmbed.setFooter({ text: `Reported` })
         return postEmbed
      }

      if (
         post.banned_at_utc &&
         post.ban_note &&
         post.ban_note == 'confirm spam' &&
         post.banned_by &&
         post.banned_by == true &&
         post.collapsed_reason_code &&
         post.collapsed_reason_code == 'CROWD_CONTROL'
      ) {
         postEmbed.setColor(config.jobOutput.modQueuePost.embedColor)
         postEmbed.setTitle('Queued Post')
         postEmbed.setURL(`https://www.reddit.com/mod/${post.subreddit}/queue`)
         postEmbed.setFooter({
            text: `Filtered by Reddit - Crowd Control (karma)`,
         })
         return postEmbed
      }

      // Unknown visibility
      if (post.banned_at_utc) {
         const bannedAtDate = new Date(post.banned_at_utc * 1000)
         const bannedAtString = bannedAtDate.toLocaleString()
         postEmbed.addFields({
            name: 'Ban Time',
            value: bannedAtString,
            inline: true,
         })
      }

      if (post.ban_note) {
         postEmbed.addFields({
            name: 'Ban Note',
            value: post.ban_note,
            inline: true,
         })
      }

      if (post.banned_by) {
         if (post.banned_by === true) {
            postEmbed.addFields({
               name: 'Banned By',
               value: 'true',
               inline: true,
            })
         } else {
            postEmbed.addFields({
               name: 'Banned By',
               value: post.banned_by,
               inline: true,
            })
         }
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

      postEmbed.setColor(config.jobOutput.spamPost.embedColor)
      postEmbed.setTitle('Unknown Post')
      postEmbed.setURL(`https://www.reddit.com/mod/${post.subreddit}/queue`)
      postEmbed.setFooter({ text: `Unusual Post - Leave for analysis` })

      return postEmbed
   },

   _getCommentEmbed(comment, jobName) {
      const commentFooterPost = `📌 ${comment.link_title.slice(
         0,
         config.commentTitleSize
      )}`
      // Create initial embed
      const commentEmbed = new EmbedBuilder()
         .setDescription(`${comment.body.slice(0, config.commentSize)}`)
         .setFooter({ text: commentFooterPost })
      // Get server based avatar image
      thisAvatarURL = this._getSubmissionAvatar(comment)
      commentEmbed.setAuthor({
         name: comment.author,
         url: `https://www.reddit.com${comment.permalink}`,
         iconURL: thisAvatarURL,
      })

      // Get visibility status and format accordingly
      if (!comment.banned_at_utc && jobName !== 'getNewModQueue') {
         commentEmbed.setColor(config.jobOutput.newComment.embedColor)
         // commentEmbed.setFooter({ text: `` })
         return commentEmbed
      }

      if (comment.banned_at_utc && comment.spam) {
         // Never seen this
         commentEmbed.setColor(config.jobOutput.spamComment.embedColor)
         commentEmbed.setTitle('Spam Comment')
         commentEmbed
            .setURL(
               `https://www.reddit.com/mod/${comment.subreddit}/queue?dx_mod_queue=enabled&queueType=removed`
            )
            .setFooter({
               text: `${commentFooterPost}\nUnusual Spam Comment - Leave for analysis`,
            })
         return commentEmbed
      }

      if (
         comment.banned_at_utc &&
         !comment.ban_note &&
         comment.banned_by &&
         comment.banned_by === true &&
         comment.removed_by_category == 'reddit'
      ) {
         commentEmbed.setColor(config.jobOutput.spamComment.embedColor)
         commentEmbed.setTitle('Removed Comment')
         commentEmbed.setURL(
            `https://www.reddit.com/mod/${comment.subreddit}/queue?dx_mod_queue=enabled&queueType=removed`
         )
         commentEmbed.setFooter({
            text: `${commentFooterPost}\nReddit Spam Comment - Uncommon`,
         })
         return commentEmbed
      }

      if (
         comment.banned_at_utc &&
         comment.ban_note &&
         comment.ban_note == 'reinforce spam' &&
         comment.banned_by &&
         comment.banned_by === true &&
         comment.removed_by_category &&
         comment.removed_by_category == 'reddit'
      ) {
         // "Removed by Reddit's spam filter"
         commentEmbed.setColor(config.jobOutput.modQueueComment.embedColor)
         commentEmbed.setTitle('Queued Comment')
         commentEmbed.setURL(
            `https://www.reddit.com/mod/${comment.subreddit}/queue`
         )
         commentEmbed.setFooter({
            text: `${commentFooterPost}\nQueued by Subreddit Spam Settings`,
         })
         return commentEmbed
      }

      // if (
      //    post.banned_at_utc &&
      //    post.ban_note &&
      //    post.ban_note == 'comfirm spam' &&
      //    post.banned_by &&
      //    post.banned_by == 'AutoModerator'
      // ) {
      //    return { status: 'Queued', subStatus: 'Automoderator ' } // this is on a comment karma one. Likely both automod and reddit reputation filtered
      // }

      if (
         comment.banned_at_utc &&
         comment.ban_note &&
         comment.ban_note == 'remove not spam' &&
         comment.banned_by &&
         comment.banned_by == 'AutoModerator' &&
         comment.author_flair_css_class == 'shadow'
      ) {
         commentEmbed.setColor(config.jobOutput.spamComment.embedColor)
         commentEmbed.setTitle('Removed Comment')
         commentEmbed.setURL(
            `https://www.reddit.com/mod/${comment.subreddit}/queue?dx_mod_queue=enabled&queueType=removed`
         )
         commentEmbed.setFooter({
            text: `${commentFooterPost}\nShadowBanned by AutoModerator`,
         })
         return commentEmbed
      }

      if (
         comment.banned_at_utc &&
         comment.ban_note &&
         comment.ban_note == 'remove not spam' &&
         comment.banned_by &&
         comment.banned_by == 'AutoModerator' &&
         comment.author_flair_css_class == 'watch'
      ) {
         commentEmbed.setColor(config.jobOutput.modQueueComment.embedColor)
         commentEmbed.setTitle('Queued Comment')
         commentEmbed.setURL(
            `https://www.reddit.com/mod/${comment.subreddit}/queue`
         )
         commentEmbed.setFooter({
            text: `${commentFooterPost}\nWatch List by AutoModerator`,
         })
         return commentEmbed
      }

      if (
         comment.banned_at_utc &&
         comment.ban_note &&
         comment.ban_note == 'remove not spam' &&
         comment.banned_by &&
         comment.banned_by == 'AutoModerator'
      ) {
         commentEmbed.setColor(config.jobOutput.modQueueComment.embedColor)
         commentEmbed.setTitle('Queued Comment')
         commentEmbed.setURL(
            `https://www.reddit.com/mod/${comment.subreddit}/queue`
         )
         commentEmbed.setFooter({
            text: `${commentFooterPost}\nFiltered by AutoModerator`,
         })
         return commentEmbed
      }

      if (comment.num_reports && comment.num_reports > 0) {
         commentEmbed.setColor(config.jobOutput.modQueueComment.embedColor)
         commentEmbed.setTitle('Queued Comment')
         commentEmbed.setURL(
            `https://www.reddit.com/mod/${comment.subreddit}/queue`
         )
         commentEmbed.setFooter({ text: `${commentFooterPost}\nReported` })
         return commentEmbed
      }

      if (
         comment.banned_at_utc &&
         comment.ban_note &&
         comment.ban_note == 'confirm spam' &&
         comment.banned_by &&
         comment.banned_by == true &&
         comment.collapsed_reason_code &&
         comment.collapsed_reason_code == 'CROWD_CONTROL'
      ) {
         commentEmbed.setColor(config.jobOutput.modQueueComment.embedColor)
         commentEmbed.setTitle('Queued Comment')
         commentEmbed.setURL(
            `https://www.reddit.com/mod/${comment.subreddit}/queue`
         )
         commentEmbed.setFooter({
            text: `${commentFooterPost}\nFiltered by Reddit - Crowd Control (karma)`,
         })
         return commentEmbed
      }

      // Unknown visibility
      if (comment.banned_at_utc) {
         const bannedAtDate = new Date(comment.banned_at_utc * 1000)
         const bannedAtString = bannedAtDate.toLocaleString()
         commentEmbed.addFields({
            name: 'Ban Time',
            value: bannedAtString,
            inline: true,
         })
      }

      if (comment.ban_note) {
         commentEmbed.addFields({
            name: 'Ban Note',
            value: comment.ban_note,
            inline: true,
         })
      }

      if (comment.banned_by) {
         if (comment.banned_by === true) {
            commentEmbed.addFields({
               name: 'Banned By',
               value: 'true',
               inline: true,
            })
         } else {
            commentEmbed.addFields({
               name: 'Banned By',
               value: comment.banned_by,
               inline: true,
            })
         }
      }

      if (comment.removed_by_category) {
         commentEmbed.addFields({
            name: 'Removed By Category',
            value: comment.removed_by_category,
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

      commentEmbed.setColor(config.jobOutput.spamComment.embedColor)
      commentEmbed.setTitle('Unknown Comment')
      commentEmbed.setURL(
         `https://www.reddit.com/mod/${comment.subreddit}/queue`
      )
      commentEmbed.setFooter({
         text: `${commentFooterPost}\nUnusual Comment - Leave for analysis`,
      })

      return commentEmbed
   },

   _getModLogEmbed(item) {
      const avatarAutoMod = 'https://i.imgur.com/2ordphG.png'
      const avatarMod = 'https://i.imgur.com/ZCZdaTJ.png'

      // Create initial embed
      const itemEmbed = new EmbedBuilder()
         .setColor(config.jobOutput.modLog.embedColor)
         .setTitle(config.jobs.getNewModLog.actions[item.action]?.text || item.action) 
         .setURL(`https://www.reddit.com/mod/${item.subreddit}/log`)
         .setFooter({ text: `r/${item.subreddit}` })

      if (item.mod == 'AutoModerator') {
         itemEmbed.setAuthor({
            name: item.mod,
            iconURL: avatarAutoMod,
         })
      } else {
         itemEmbed.setAuthor({
            name: item.mod,
            iconURL: avatarMod,
         })
      }

      // Specific formats
      // comment approve/remove
      if (
         item.action &&
         ['approvecomment', 'removecomment', 'spamcomment'].includes(
            item.action
         ) &&
         item.details &&
         // item.details == 'unspam' &&
         item.target_author &&
         item.target_body
      ) {
         // itemEmbed.setTitle(item.action)
         // itemEmbed.setDescription(`**${item.target_author}**\n${item.target_body.slice(0, 150)}\n*${item.details}*`)
         itemEmbed.setDescription(
            `**${item.target_author}**\n${item.target_body.slice(0, 150)}`
         )
         itemEmbed.setFooter({ text: item.details })
         return itemEmbed
      }

      // post approve/remove
      if (
         item.action &&
         ['approvelink', 'removelink', 'spamlink'].includes(item.action) &&
         item.details &&
         // item.details == 'unspam' &&
         item.target_author &&
         item.target_title
      ) {
         let postText = `**${item.target_title.slice(0, 50)}**`
         if (item.target_body) {
            postText += `\n${item.target_body.slice(0, 150)}`
         }
         // itemEmbed.setTitle(item.action)
         itemEmbed.setDescription(`${item.target_author}\n${postText}`)
         itemEmbed.setFooter({ text: item.details })
         return itemEmbed
      }

      if (item.details) {
         itemEmbed.addFields({
            name: 'Details',
            value: item.details,
            inline: true,
         })
      }
      if (item.description) {
         itemEmbed.addFields({
            name: 'Description',
            value: item.description.slice(0, 240),
            inline: true,
         })
      }
      if (item.target_author) {
         itemEmbed.addFields({
            name: 'Target Author',
            value: item.target_author,
            inline: true,
         })
      }
      if (item.target_title) {
         itemEmbed.addFields({
            name: 'Target Title',
            value: item.target_title.slice(0, 70),
            inline: true,
         })
      }
      if (item.target_body) {
         itemEmbed.addFields({
            name: 'Target Body',
            value: item.target_body.slice(0, 70),
            inline: true,
         })
      }

      return itemEmbed
   },

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
                     // messageEmbed = this._makePostEmbed(item.data)
                     messageEmbed = this._getPostEmbed(item.data, jobName)
                  } else if (item.kind == 't1') {
                     // messageEmbed = this._makeCommentEmbed(item.data)
                     messageEmbed = this._getCommentEmbed(item.data, jobName)
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
                  messageEmbed = this._getCommentEmbed(comment, jobName)
                  message = { embeds: [messageEmbed] }
                  sendChannel = redditServers[comment.subreddit]['Stream']
                  this.sendMessage(client, sendChannel, message)
               }
            }
            break
         case 'getNewPosts':
            if (response.status == 'success') {
               let messageEmbed = ''
               for (const post of response.data) {
                  messageEmbed = this._getPostEmbed(post, jobName)
                  message = { embeds: [messageEmbed] }
                  sendChannel = redditServers[post.subreddit]['Stream']
                  this.sendMessage(client, sendChannel, message)
               }
            }
            break

         case 'getNewModLog':
            if (response.status == 'success') {
               for (const item of response.data) {
                  const actionEnabled =
                     config.jobs.getNewModLog.actions[item.action]?.enabled
                  if (actionEnabled !== false) {
                     const messageEmbed = this._getModLogEmbed(item)
                     message = { embeds: [messageEmbed] }
                     sendChannel = redditServers[item.subreddit]['Mod Log']
                     this.sendMessage(client, sendChannel, message)
                  }
               }
            }
            break

         case 'scheduleFast':
            if (response.status == 'success') {
               const jobEmbed = new EmbedBuilder()
                  .setColor(config.jobOutput.scheduleFast.embedColor)
                  .setTitle('Fast Schedule Enabled')
               message = { embeds: [jobEmbed] }
               sendChannel = redditServers['default']['Jobs']
               this.sendMessage(client, sendChannel, message)
            }
            break

         case 'scheduleSlow':
            if (response.status == 'success') {
               const jobEmbed = new EmbedBuilder()
                  .setColor(config.jobOutput.scheduleSlow.embedColor)
                  .setTitle('Slow Schedule Enabled')
               message = { embeds: [jobEmbed] }
               sendChannel = redditServers['default']['Jobs']
               this.sendMessage(client, sendChannel, message)
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
               sendChannel = redditServers['default']['Jobs']
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
