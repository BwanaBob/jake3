const scheduler = require('../modules/Scheduler')
const BlueSky = require('../modules/BlueSky.js')
const {
   blueSkyRedditUsername,
   blueSkyRedditPassword,
   blueSkyTestUsername,
   blueSkyTestPassword,
} = require('../credentials')
const bluesky = new BlueSky(blueSkyRedditUsername, blueSkyRedditPassword)
const config = require('../config')
const { postText, imagePath } = config.jobs.blueSkyPostThread

module.exports = () => ({
   name: 'blueSkyPostThread',
     cronExpression: '0 58 18 * * FRI,SAT', // pre First Shift bingo post - live
   //   cronExpression: '0 0 12 11 1 *', // noon 1/1 (Park It)
   //   cronExpression: '*/15 * * * * *', // Every 15 seconds (testing)

   jobFunction: async () => {
      try {
         await bluesky.createPostWithImage(postText, imagePath)
         return { status: 'success' }
      } catch (error) {
         console.error(`Error posting live thread post: ${error.message}`)
         throw error
      }
   },
})
