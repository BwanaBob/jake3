const scheduler = require('../modules/Scheduler')
const BlueSky = require('../modules/BlueSky.js')
const { blueSkyBingoUsername, blueSkyBingoPassword } = require('../credentials')
const bluesky = new BlueSky(blueSkyBingoUsername, blueSkyBingoPassword)
const config = require('../config')
const { postText, imagePaths } = config.jobs.blueSkyPostBingo

module.exports = () => ({
   name: 'blueSkyPostBingo',
   // cronExpression: '0 59 18 * * FRI,SAT', // pre First Shift bingo post - live
     cronExpression: '0 0 12 11 1 *', // noon 1/1 (Park It)
   //   cronExpression: '*/15 * * * * *', // Every 15 seconds (testing)

   jobFunction: async () => {
      try {
         // Calculate the current day of the year
         const currentDay = new Date().getDate()
         // Use modulo to select the array index
         const selectedIndex = currentDay % imagePaths.length
         //   console.log(imagePaths[selectedIndex])
         await bluesky.createPostWithImage(postText, imagePaths[selectedIndex])
         return { status: 'success' }
      } catch (error) {
         console.error(`Error posting bingo post: ${error.message}`)
         throw error
      }
   },
})
