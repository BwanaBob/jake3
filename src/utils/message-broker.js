const { EmbedBuilder, ThreadAutoArchiveDuration } = require('discord.js')
const { commentEmbedColor } = require('../config')

module.exports = {
    async processDiscordMessage(client, jobName, response) {
      // console.log("message broker activated");
      let sendChannel = client.channels.cache.get('392120898909634561') // bot test
      let sendThread = ''
      const findThread = sendChannel.threads.cache.find(
         (x) => x.name === 'Reddit Jobs'
      )
      if (findThread) {
        sendThread = findThread;
        await sendThread.join()
      } else {
         sendThread = await sendChannel.threads.create({
            name: 'Reddit Jobs',
            autoArchiveDuration: ThreadAutoArchiveDuration.OneHour,
            joinable: true,
            reason: 'Needed a separate thread for jobs',
         })
      }

      // console.log(sendChannel);
      let message = `Job **${jobName}** executed.\n`

      switch (jobName) {
         case 'logTopComments':
            message += 'Top Comments:\n'
            response.forEach((comment, index) => {
               message += `**${index + 1}. ${comment.data.author}:** ${
                  comment.data.body
               } (Score: ${comment.averageScore.toFixed(2)})\n`
            })
            break
         case 'tidy':
            // const noticeImage = new AttachmentBuilder("./resources/thumb-wastebasket.png", {name: "thumb-wastebasket.png"});
            const tidyEmbed = new EmbedBuilder()
               .setColor(commentEmbedColor)
               .setTitle('!tidy Executed')
            //   .setThumbnail("attachment://thumb-wastebasket.png")
            //   .setAuthor({
            //     name: `${message.member.displayName} (${message.author.tag})`,
            //     iconURL: `${message.member.displayAvatarURL()}`,
            //   });
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
            break
         case 'logNewComments':
            message += 'New Comments:\n'
            response.forEach((comment, index) => {
               message += `**${index + 1}. ${comment.data.author}:** ${
                  comment.data.body
               }\n`
            })
            break
         // Add more cases for different job names and their respective formatting
         default:
            message += 'Data:\n'
            message += JSON.stringify(response, null, 2)
            break
      }
      const noticeMessage = await sendThread.send(message)
   },
}
