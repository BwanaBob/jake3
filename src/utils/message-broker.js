const {
   EmbedBuilder,
   AttachmentBuilder,
   MessageFlagsBitField,
} = require('discord.js')
const config = require('../config')
const attachmentAvatarDefault = new AttachmentBuilder(
   './resources/avatar-default.png',
   { name: 'avatar-default.png' }
)
const attachmentAvatarLAFR = new AttachmentBuilder(
   './resources/avatar-lafr-logo.png',
   { name: 'avatar-lafr-logo.png' }
)
const attachmentAvatarKillerCases = new AttachmentBuilder(
   './resources/avatar-default.png',
   { name: 'avatar-default.png' }
)
const attachmentAvatarOPL = new AttachmentBuilder(
   './resources/avatar-opl-logo.png',
   { name: 'avatar-opl-logo.png' }
)
const attachmentAvatarP24 = new AttachmentBuilder(
   './resources/avatar-p24-logo.png',
   { name: 'avatar-p24-logo.png' }
)
const attachmentAvatarAutoMod = new AttachmentBuilder(
   './resources/avatar-automoderator-shield.png',
   { name: 'avatar-automoderator-shield.png' }
)
const attachmentAvatarMod = new AttachmentBuilder(
   './resources/avatar-police-car-light-blue.png',
   { name: 'avatar-police-car-light-blue.png' }
)

module.exports = {
   _getSubmissionAttachment(submission) {
      let thisAvatar = attachmentAvatarDefault

      if (
         submission.subreddit == 'OnPatrolLive' ||
         submission.subreddit == 'OPLTesting'
      ) {
         thisAvatar = attachmentAvatarOPL
      } else if (submission.subreddit == 'Police247') {
         thisAvatar = attachmentAvatarP24
      } else if (submission.subreddit == 'KillerCases') {
         thisAvatar = attachmentAvatarKillerCases
      } else if (
         submission.subreddit == 'LAFireandRescue' ||
         submission.subreddit == 'LAFireRescue'
      ) {
         thisAvatar = attachmentAvatarLAFR
      }
      return thisAvatar
   },

   async _downloadImage(url) {
      const response = await fetch(url, {
         headers: {
            Accept: 'image/webp,image/apng,image/*,*/*;q=0.8',
            'User-Agent':
               'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:90.0) Gecko/20100101 Firefox/90.0',
            Referer: 'https://www.reddit.com/', // Set referer to the main Reddit domain
         },
      })
      if (!response.ok) {
         throw new Error(`Failed to fetch image. Status: ${response.status}`)
      }
      const contentType = response.headers.get('content-type')
      let imageName = 'image.jpg'
      if (contentType.includes('gif')) {
         imageName = 'image.gif'
      }
      if (contentType.includes('png')) {
         imageName = 'image.png'
      }

      // const buffer = await response.buffer();
      const arrayBuffer = await response.arrayBuffer()
      const imageBuffer = Buffer.from(arrayBuffer)
      return { name: imageName, buffer: imageBuffer }
   },

   async _getCommentImage(comment) {
      if (comment.media_metadata) {
         const mediaMetadata = comment.media_metadata
         const mediaId = Object.keys(mediaMetadata)[0] // Get the first key in media_metadata
         const media = mediaMetadata[mediaId]
         // console.log(media)
         if (media.t && media.t == 'giphy') {
            // const gifIdMatch = media.ext.match(/\/gifs\/[^\/]+\/([a-zA-Z0-9]+)/)
            const gifIdMatch = media.ext.match(
               /\/gifs\/(?:[a-zA-Z0-9_-]+\/)?([a-zA-Z0-9]+)/
            )
            if (gifIdMatch && gifIdMatch[1]) {
               const gifId = gifIdMatch[1]
               // console.log(gifId)
               const removeBodyText = `![gif](${media.id})`
               return {
                  url: `https://i.giphy.com/media/${gifId}/giphy.gif`,
                  removeBodyText: removeBodyText,
                  addEmbedURL: media.ext,
               }
            }
         }

         if (media.s.u) {
            const imageURL = decodeURIComponent(
               media.s.u.replace(/&amp;/g, '&')
            )
            const imageBuffer = await this._downloadImage(imageURL)
            return {
               name: imageBuffer.name,
               buffer: imageBuffer.buffer,
               removeBodyText: imageURL,
               addEmbedURL: imageURL,
            }
         }

         if (media.s.gif) {
            const imageURL = decodeURIComponent(
               media.s.gif.replace(/&amp;/g, '&')
            )
            const imageBuffer = await this._downloadImage(imageURL)
            return {
               name: imageBuffer.name,
               buffer: imageBuffer.buffer,
               removeBodyText: imageURL,
               addEmbedURL: imageURL,
            }
         }
      }
      return false
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

   _getPostMessage(post, jobName) {
      // Create initial embed
      const postEmbed = new EmbedBuilder()
      // Get server based avatar image
      let thisAttachment = this._getSubmissionAttachment(post)
      postEmbed.setAuthor({
         name: post.author,
         url: `https://www.reddit.com${post.permalink}`,
         iconURL: `attachment://${thisAttachment.name}`,
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
         return { embeds: [postEmbed], files: [thisAttachment] }
      }

      if (post.banned_at_utc && post.spam) {
         // Never seen this
         postEmbed.setColor(config.jobOutput.spamPost.embedColor)
         postEmbed.setTitle('Spam Post')
         postEmbed.setURL(
            `https://www.reddit.com/mod/${post.subreddit}/queue?dx_mod_queue=enabled&queueType=removed`
         )
         postEmbed.setFooter({ text: `Unusual Spam Post - Leave for analysis` })
         return { embeds: [postEmbed], files: [thisAttachment] }
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
         return { embeds: [postEmbed], files: [thisAttachment] }
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
         return { embeds: [postEmbed], files: [thisAttachment] }
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
         return { embeds: [postEmbed], files: [thisAttachment] }
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
         return { embeds: [postEmbed], files: [thisAttachment] }
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
         return { embeds: [postEmbed], files: [thisAttachment] }
      }

      if (
         post.banned_at_utc &&
         post.ban_note &&
         post.ban_note !== 'remove not spam' &&
         post.banned_by &&
         post.banned_by == 'AutoModerator'
      ) {
         postEmbed.setColor(config.jobOutput.modQueuePost.embedColor)
         postEmbed.setTitle('Queued Post')
         postEmbed.setURL(`https://www.reddit.com/mod/${post.subreddit}/queue`)
         postEmbed.setFooter({ text: `Filtered by AutoModerator and Reddit` })
         return { embeds: [postEmbed], files: [thisAttachment] }
      }

      if (post.num_reports && post.num_reports > 0) {
         postEmbed.setColor(config.jobOutput.modQueuePost.embedColor)
         postEmbed.setTitle('Queued Post')
         postEmbed.setURL(`https://www.reddit.com/mod/${post.subreddit}/queue`)
         postEmbed.setFooter({ text: `Reported` })
         return { embeds: [postEmbed], files: [thisAttachment] }
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
         return { embeds: [postEmbed], files: [thisAttachment] }
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

      return { embeds: [postEmbed], files: [thisAttachment] }
   },

   async _getCommentMessage(comment, jobName) {
      const commentFooterPost = `📌 ${comment.link_title.slice(
         0,
         config.commentTitleSize
      )}`
      // Create initial embed
      const commentEmbed = new EmbedBuilder()
         .setDescription(`${comment.body.slice(0, config.commentSize)}`)
         .setFooter({ text: commentFooterPost })
      // Get server based avatar image
      let commentUserAttachment = this._getSubmissionAttachment(comment)
      let commentEmbedAttachments = [commentUserAttachment]
      commentEmbed.setAuthor({
         name: comment.author,
         url: `https://www.reddit.com${comment.permalink}`,
         iconURL: `attachment://${commentUserAttachment.name}`,
      })

      // Get image
      if (comment.media_metadata) {
         let commentImage = await this._getCommentImage(comment)
         if (commentImage) {
            if (commentImage.buffer) {
               const commentImageAttachment = new AttachmentBuilder(
                  commentImage.buffer,
                  {
                     name: commentImage.name,
                  }
               )
               commentEmbedAttachments.push(commentImageAttachment)
               commentEmbed.setImage(`attachment://${commentImage.name}`)
            } else if (commentImage.url) {
               commentEmbed.setImage(commentImage.url)
            }
            // remove url from the body
            // const cleanedBody = comment.body.replace(commentImage.removeBodyText, '').trim();
            const cleanedBody = comment.body
               .replace(commentImage.removeBodyText, '')
               .replace(/\n\s*\n/g, '\n')
               .trim()
            if (cleanedBody) {
               commentEmbed.setDescription(
                  `${cleanedBody.slice(0, config.commentSize)}`
               )
            }
            commentEmbed.setTitle('Comment with image')
            commentEmbed.setURL(commentImage.addEmbedURL)
         }
      }

      // Get visibility status and format accordingly
      if (!comment.banned_at_utc && jobName !== 'getNewModQueue') {
         commentEmbed.setColor(config.jobOutput.newComment.embedColor)
         // commentEmbed.setFooter({ text: `` })
         return { embeds: [commentEmbed], files: commentEmbedAttachments }
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
         return { embeds: [commentEmbed], files: commentEmbedAttachments }
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
         return { embeds: [commentEmbed], files: commentEmbedAttachments }
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
         return { embeds: [commentEmbed], files: commentEmbedAttachments }
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
         return { embeds: [commentEmbed], files: commentEmbedAttachments }
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
         return { embeds: [commentEmbed], files: commentEmbedAttachments }
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
         return { embeds: [commentEmbed], files: commentEmbedAttachments }
      }

      if (
         comment.banned_at_utc &&
         comment.ban_note &&
         comment.ban_note !== 'remove not spam' &&
         comment.banned_by &&
         comment.banned_by == 'AutoModerator'
      ) {
         commentEmbed.setColor(config.jobOutput.modQueueComment.embedColor)
         commentEmbed.setTitle('Queued Comment')
         commentEmbed.setURL(
            `https://www.reddit.com/mod/${comment.subreddit}/queue`
         )
         commentEmbed.setFooter({
            text: `${commentFooterPost}\nFiltered by AutoModerator and Reddit`,
         })
         return { embeds: [commentEmbed], files: commentEmbedAttachments }
      }

      if (comment.num_reports && comment.num_reports > 0) {
         commentEmbed.setColor(config.jobOutput.modQueueComment.embedColor)
         commentEmbed.setTitle('Queued Comment')
         commentEmbed.setURL(
            `https://www.reddit.com/mod/${comment.subreddit}/queue`
         )
         commentEmbed.setFooter({ text: `${commentFooterPost}\nReported` })
         return { embeds: [commentEmbed], files: commentEmbedAttachments }
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
         return { embeds: [commentEmbed], files: commentEmbedAttachments }
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

      return { embeds: [commentEmbed], files: commentEmbedAttachments }
   },

   _getModLogMessage(item) {
      let thisAttachment = attachmentAvatarDefault

      // Create initial embed
      const itemEmbed = new EmbedBuilder()
         .setColor(config.jobOutput.modLog.embedColor)
         .setTitle(
            config.jobs.getNewModLog.actions[item.action]?.text || item.action
         )
         .setURL(`https://www.reddit.com/mod/${item.subreddit}/log`)
         .setFooter({ text: `r/${item.subreddit}` })

      if (item.mod == 'AutoModerator') {
         thisAttachment = attachmentAvatarAutoMod
      } else {
         thisAttachment = attachmentAvatarMod
      }
      itemEmbed.setAuthor({
         name: item.mod,
         iconURL: `attachment://${thisAttachment.name}`,
      })

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
            `**${item.target_author}**\n${item.target_body.slice(
               0,
               config.modLogCommentSize
            )}`
         )
         itemEmbed.setFooter({ text: `${item.details}` })
         return { embeds: [itemEmbed], files: [thisAttachment] }
      }

      // post approve/remove
      if (
         item.action &&
         ['approvelink', 'removelink', 'spamlink'].includes(item.action) &&
         item.details &&
         item.target_author &&
         item.target_title
      ) {
         let postText = `**${item.target_title.slice(
            0,
            config.modLogTitleSize
         )}**`
         // if (item.target_body) {
         //    postText += `\n${item.target_body.slice(0, config.modLogCommentSize)}`
         // }
         itemEmbed.setDescription(`${item.target_author}\n${postText}`)
         itemEmbed.setFooter({ text: `${item.details}` })
         return { embeds: [itemEmbed], files: [thisAttachment] }
      }

      // add removal reason
      if (
         item.action &&
         item.action == 'addremovalreason' &&
         item.target_author
      ) {
         itemEmbed.addFields({
            name: 'Reason',
            value: item.description,
            inline: false,
         })
         let postText = item.target_author

         if (item.target_title) {
            // item is post
            postText += `\n**${item.target_title.slice(
               0,
               config.modLogTitleSize
            )}**`
         }
         if (item.target_body) {
            postText += `\n${item.target_body.slice(
               0,
               config.modLogCommentSize
            )}`
         }
         itemEmbed.setDescription(`${postText}`)
         return { embeds: [itemEmbed], files: [thisAttachment] }
      }

      // Default undefined type
      if (item.details) {
         itemEmbed.setFooter({ text: `${item.details}` })
      }

      if (item.description) {
         itemEmbed.addFields({
            name: 'Description',
            value: item.description.slice(0, config.modLogDescriptionSize),
            inline: true,
         })
      }

      if (item.target_fullname) {
         // acts on a post or comment. put related fields in the embed description
         let descriptionText = ''

         if (item.target_author) {
            descriptionText += item.target_author
         }
         if (item.target_title) {
            descriptionText += `\n**${item.target_title.slice(
               0,
               config.modLogTitleSize
            )}**`
         } else if (item.target_body) {
            // only add body if no title exists
            descriptionText += `\n${item.target_body.slice(
               0,
               config.modLogCommentSize
            )}`
         }
         itemEmbed.setDescription(descriptionText)
      } else {
         // probably won't have any of these (without target_fullname), but just in case
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
               value: item.target_title.slice(0, config.modLogTitleSize),
               inline: true,
            })
         } else if (item.target_body) {
            itemEmbed.addFields({
               name: 'Target Body',
               value: item.target_body.slice(0, config.modLogCommentSize),
               inline: true,
            })
         }
      }
      return { embeds: [itemEmbed], files: [thisAttachment] }
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
               let message = {}
               for (const item of response.data) {
                  if (item.kind == 't3') {
                     // messageEmbed = this._makePostEmbed(item.data)
                     message = this._getPostMessage(item.data, jobName)
                  } else if (item.kind == 't1') {
                     // messageEmbed = this._makeCommentEmbed(item.data)
                     message = await this._getCommentMessage(item.data, jobName)
                  } else {
                     break
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
               tidyEmbed.addFields({
                  name: 'Post Title',
                  value: `[${response.data.title}](${response.data.url})`,
                  inline: false,
               })
            } else {
               tidyEmbed.addFields({
                  name: 'Status',
                  value: response.status,
                  inline: false,
               })
            }
            if (response.data?.subreddit) {
               tidyEmbed.setFooter({ text: `r/${response.data.subreddit}` })
            }
            message = { embeds: [tidyEmbed] }
            // sendChannel = client.params.get('jobsChannelId')
            sendChannel = redditServers[response.data.subreddit]['Jobs']
            this.sendMessage(client, sendChannel, message)
            if (response.data.subreddit == 'OnPatrolLive') {
               const modChannel = '1250589626717175910'
               this.sendMessage(client, modChannel, message)
            }

            break
         case 'getNewComments':
            if (response.status == 'success') {
               for (const comment of response.data) {
                  let message = await this._getCommentMessage(comment, jobName)
                  // ping bingo mod if bingo is mentioned
                  const bingoExpression = new RegExp(
                     '\\b(thatsa)?bingo\\b',
                     'i'
                  )
                  if (
                     comment.subreddit == 'OnPatrolLive' &&
                     comment.body.match(bingoExpression)
                  ) {
                     const bingoModChannel = '1250581630754623549'
                     this.sendMessage(client, bingoModChannel, message)
                     // const bingoPing = '1119713563641118901';
                     // message.content = `<@&${bingoPing}>`
                  }
                  sendChannel = redditServers[comment.subreddit]['Stream']
                  this.sendMessage(client, sendChannel, message)
               }
            }
            break
         case 'getNewPosts':
            if (response.status == 'success') {
               for (const post of response.data) {
                  let message = this._getPostMessage(post, jobName)
                  // ping bingo mod if bingo is mentioned
                  const bingoExpression = new RegExp(
                     '\\b(thatsa)?bingo\\b',
                     'i'
                  )
                  const ignoreTitleExpression = new RegExp(
                     '\\bLive.Thread\\b',
                     'i'
                  )
                  if (
                     post.subreddit == 'OnPatrolLive' &&
                     !post.title.match(ignoreTitleExpression) &&
                     (post.title.match(bingoExpression) ||
                        post.selftext.match(bingoExpression))
                  ) {
                     const bingoModChannel = '1250581630754623549'
                     this.sendMessage(client, bingoModChannel, message)
                     // const bingoPing = '1119713563641118901'
                     // message.content = `<@&${bingoPing}>`
                  }
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
                     // const messageEmbed = this._getModLogMessage(item)
                     // message = { embeds: [messageEmbed] }
                     const message = this._getModLogMessage(item)
                     sendChannel = redditServers[item.subreddit]['Mod Log']
                     this.sendMessage(client, sendChannel, message)
                  }
               }
            }
            break

         case 'getTempBans':
            if (response.status == 'success') {
               const bansEmbed = new EmbedBuilder()
                  .setColor(config.jobOutput.tidy.embedColor)
                  .setTitle('Current Temporary Bans')
                  .setFooter({ text: `r/OnPatrolLive` })
                  .setDescription('<none>')

               let banList = ''

               if (response.data.length > 0) {
                  for (const ban of response.data) {
                     banList += `${ban.days_left || 0} - `
                     banList += `[${ban.name}](https://www.reddit.com/mod/OnPatrolLive/banned?userNameSearch=${ban.name})`
                     if (ban.note && ban.note !== '') {
                        banList += ` - ${ban.note.slice(0, 50)}`
                     }
                     banList += `\n`
                  }
               } else {
                  banList = 'None'
               }
               bansEmbed.setDescription(banList)
               message = { embeds: [bansEmbed] }
               sendChannel = client.params.get('jobsChannelId')
               this.sendMessage(client, sendChannel, message)
            }
            break

         case 'getUnusedFlairs':
            if (response.status == 'success') {
               const flairEmbed = new EmbedBuilder()
                  .setColor(config.jobOutput.tidy.embedColor)
                  .setTitle('Unused User Flairs')
                  .setFooter({ text: `r/OnPatrolLive` })
                  .setDescription('<none>')

               let flairList = ''

               if (response.data.length > 0) {
                  for (const flair of response.data) {
                     flairList += `${flair.text || '<none>'}`
                     flairList += `\n`
                  }
               } else {
                  flairList = 'None'
               }
               flairEmbed.setDescription(flairList)
               message = { embeds: [flairEmbed] }
               sendChannel = client.params.get('jobsChannelId')
               this.sendMessage(client, sendChannel, message)
            }
            break

         case 'getCotNFlairs':
            if (response.status == 'success') {
               // console.log(response.data);
               const flairWinnerEmbed = new EmbedBuilder()
                  .setColor(config.jobOutput.tidy.embedColor)
                  .setTitle('CotN Winner User Flairs')
                  .setFooter({ text: response.subreddit })
                  .setDescription('TBD')
               const flairRoyalEmbed = new EmbedBuilder()
                  .setColor(config.jobOutput.tidy.embedColor)
                  .setTitle('CotN Royal User Flairs')
                  .setFooter({ text: response.subreddit })
                  .setDescription('TBD')

               let flairWinnerUserList = ''
               let flairRoyalUserList = ''

               if (response.data.length > 0) {
                  // console.log(response.data)
                  for (const flairUser of response.data) {
                     if (
                        flairUser.flair_text
                           .trim()
                           .toLowerCase()
                           .normalize('NFKD')
                           .includes('royal')
                     ) {
                        flairRoyalUserList += `${flairUser.user || '<none>'}`
                        flairRoyalUserList += `|`
                        flairRoyalUserList += `${
                           flairUser.flair_text || '<none>'
                        }`
                        flairRoyalUserList += `\n`
                        // console.log(`${flairUser.user} | ${flairUser.flair_text}`)
                     } else {
                        flairWinnerUserList += `${flairUser.user || '<none>'}`
                        flairWinnerUserList += `|`
                        flairWinnerUserList += `${
                           flairUser.flair_text || '<none>'
                        }`
                        flairWinnerUserList += `\n`
                        // console.log(`${flairUser.user} | ${flairUser.flair_text}`)
                     }
                  }
               } else {
                  flairWinnerUserList = 'None'
                  flairRoyalUserList = 'None'
               }
               if (flairWinnerUserList) {
                  flairWinnerEmbed.setDescription(flairWinnerUserList)
               }
               if (flairRoyalUserList) {
                  flairRoyalEmbed.setDescription(flairRoyalUserList)
               }

               const winnerMessage = { embeds: [flairWinnerEmbed] }
               const royalMessage = { embeds: [flairRoyalEmbed] }
               sendChannel = client.params.get('jobsChannelId')
               this.sendMessage(client, sendChannel, winnerMessage).then(() =>
                  this.sendMessage(client, sendChannel, royalMessage)
               )
            }
            break

         case 'getFlairUsage':
            if (response.status == 'success') {
               const flairEmbed = new EmbedBuilder()
                  .setColor(config.jobOutput.tidy.embedColor)
                  .setTitle('User Flair Usage')
                  .setFooter({ text: response.subreddit })
                  .setDescription('<none>')
               let flairList = ''

               // console.log(response.data)
               response.data.sortedFlairUsage.forEach(flair => {
                     // flairList += `${flair.flair_text || '<none>'}`
                     flairList += `${flair.count || '0'}`
                     flairList += ` - `
                     flairList += `${flair.css_class || '<none>'}`
                     flairList += `\n`
                     // console.log(`${flairUser.user} | ${flairUser.flair_text}`)
                  }
               )

               if (flairList) {
                  flairEmbed.setDescription(flairList)
               }
               const flairMessage = { embeds: [flairEmbed] }
               sendChannel = client.params.get('jobsChannelId')
               this.sendMessage(client, sendChannel, flairMessage)
            }

            break

         case 'scheduleFast':
            if (response.status == 'success') {
               const jobEmbed = new EmbedBuilder()
                  .setColor(config.jobOutput.scheduleFast.embedColor)
                  .setTitle('Fast Schedule Enabled')
               message = { embeds: [jobEmbed] }
               sendChannel = redditServers['OnPatrolLive']['Jobs']
               this.sendMessage(client, sendChannel, message)
            }
            break

         case 'scheduleSlow':
            if (response.status == 'success') {
               const jobEmbed = new EmbedBuilder()
                  .setColor(config.jobOutput.scheduleSlow.embedColor)
                  .setTitle('Slow Schedule Enabled')
               message = { embeds: [jobEmbed] }
               sendChannel = redditServers['OnPatrolLive']['Jobs']
               this.sendMessage(client, sendChannel, message)
            }
            break
            
         case 'blueSkyPostBingo':
            if (response.status == 'success') {
               const jobEmbed = new EmbedBuilder()
                  .setColor(config.jobOutput.blueSkyPostBingo.embedColor)
                  .setTitle('🦋 BlueSky Bingo Post Successful')
               message = { embeds: [jobEmbed] }
               sendChannel = redditServers['OnPatrolLive']['Jobs']
               this.sendMessage(client, sendChannel, message)
            }
            break

         case 'blueSkyPostThread':
            if (response.status == 'success') {
               const jobEmbed = new EmbedBuilder()
                  .setColor(config.jobOutput.blueSkyPostThread.embedColor)
                  .setTitle('🦋 BlueSky Live Thread Post Successful')
               message = { embeds: [jobEmbed] }
               sendChannel = redditServers['OnPatrolLive']['Jobs']
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
                        iconURL: `attachment://${attachmentAvatarDefault.name}`,
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
                     files: [attachmentAvatarDefault],
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
                  .setDescription(`\`\`\`${statsDetail}\`\`\``)

               message = { embeds: [statsEmbed] }
               sendChannel = redditServers['default']['Jobs']
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
