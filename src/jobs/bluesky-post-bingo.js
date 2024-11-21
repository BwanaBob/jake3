const scheduler = require('../modules/Scheduler')
const BlueSky = require("../modules/BlueSky.js");
const { blueSkyBingoUser, blueSkyBingoPassword } = require('../credentials')
const bluesky = new BlueSky(blueSkyBingoUser, blueSkyBingoPassword);
const config = require('../config')
const { postText, imagePaths } = config.jobs.blueSkyPostBingo

module.exports = () => ({
   name: 'blueSkyPostBingo',
      cronExpression: '0 59 18 * * FRI,SAT', // pre First Shift bingo post - live
    //   cronExpression: '0 0 12 1 1 *', // noon 1/1 (Park It)
    //   cronExpression: '*/15 * * * * *', // Every 15 seconds (testing)

   jobFunction: async () => {
      // Calculate the current day of the year
      const currentDay = new Date().getDate()
      // Use modulo to select the array index
      const selectedIndex = currentDay % imagePaths.length
    //   console.log(imagePaths[selectedIndex])
      bluesky.createPostWithImage(postText, imagePaths[selectedIndex])
      return { status: 'success' }
   },
})
