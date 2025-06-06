const scheduler = require('../modules/Scheduler.js')
const BlueSky = require('../modules/BlueSky.js')
const { blueSkyBingoUsername, blueSkyBingoPassword } = require('../credentials.js')
const bluesky = new BlueSky(blueSkyBingoUsername, blueSkyBingoPassword)
const config = require('../config.js')
const { postText, imagePaths, singleImage } = config.jobs.blueSkyPostBingo

module.exports = () => ({
   name: 'blueSkyPostBingo',
   cronExpression: '0 59 18 * * FRI,SAT', // pre First Shift bingo post - live
   //   cronExpression: '0 0 12 11 1 *', // noon 1/1 (Park It)
   //   cronExpression: '*/15 * * * * *', // Every 15 seconds (testing)

   jobFunction: async () => {
      try {
         // const daysSinceEpoch = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
         // const selectedIndex = daysSinceEpoch % imagePaths.length;
         // await bluesky.createPostWithImage(postText, imagePaths[selectedIndex])
         await bluesky.createPostWithImage(postText, singleImage)
         return { status: 'success' }
      } catch (error) {
         console.error(`[${new Date().toLocaleString()}] Error posting bingo post: ${error.message}`)
         throw error
      }
   },
})
