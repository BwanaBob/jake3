const config = require('../config')
const { subreddit, startDate, startTime, endDate, endTime } =
   config.jobs.getModLog

// Helper function to get the timestamp for the specified date and time
const getSpecificTime = (date, time) => {
   const [year, month, day] = date.split('-').map(Number)
   const [hours, minutes, seconds] = time.split(':').map(Number)
   return Math.floor(
      new Date(year, month - 1, day, hours, minutes, seconds).getTime() / 1000
   )
}

// Function to analyze the modlog entries
const analyzeModlog = (entries, logger) => {
   const autoModRemovals = {}

   // Track AutoModerator removals
   entries.forEach((entry) => {
      if (
         entry.data.mod === 'AutoModerator' &&
         entry.data.action === 'removecomment'
      ) {
         autoModRemovals[entry.data.target_fullname] = {
            details: entry.data.details,
            approved: false,
            removed: false,
         }
      }
   })

   // Track subsequent actions by human moderators
   entries.forEach((entry) => {
      const targetId = entry.data.target_fullname
      if (autoModRemovals[targetId]) {
         if (
            entry.data.mod !== 'AutoModerator' &&
            entry.data.action === 'approvecomment'
         ) {
            autoModRemovals[targetId].approved = true
         } else if (
            entry.data.mod !== 'AutoModerator' &&
            entry.data.action === 'removecomment'
         ) {
            autoModRemovals[targetId].removed = true
         }
      }
   })

   // Group and display results
   const groupedEntries = Object.values(autoModRemovals).reduce(
      (acc, entry) => {
         const ruleDetail = entry.details
         if (!acc[ruleDetail]) {
            acc[ruleDetail] = { approved: 0, removed: 0 }
         }
         if (entry.approved) {
            acc[ruleDetail].approved++
         }
         if (entry.removed) {
            acc[ruleDetail].removed++
         }
         return acc
      },
      {}
   )

   for (const [ruleDetail, counts] of Object.entries(groupedEntries)) {
      const total = counts.approved + counts.removed
      const approvedPercentage = (counts.approved / total) * 100
      const removedPercentage = (counts.removed / total) * 100
      logger.info({
         emoji: '',
         columns: [
            'Mod Log',
            {
               min: 11,
               max: 11,
               text: `✅ ${counts.approved}/${counts.removed} ⛔`,
            },
            `${approvedPercentage.toFixed(1)}% / ${removedPercentage.toFixed(
               1
            )}%`,
            ruleDetail,
         ],
      })
      //   console.log(`✅ ${counts.approved}/${counts.removed} ⛔ (${approvedPercentage.toFixed(2)}% / ${removedPercentage.toFixed(2)}%) - Rule: ${ruleDetail}`);
   }
}

module.exports = ({ reddit, logger }) => ({
   name: 'getModLog',

   cronExpression: '0 0 12 1 1 *', // noon 1/1 (Park It)
   // cronExpression: '0 * * * * *', // Every 1 minute (testing)

   jobFunction: async () => {
      // logger.info({emoji: '💬', columns: ['getModLog', `Starting`, subreddit]});
      try {
         const specificStartTime = getSpecificTime(startDate, startTime) // Timestamp for specific start date and time
         const specificEndTime = getSpecificTime(endDate, endTime) // Timestamp for specific end date and time

         let after = ''
         let allEntries = []
         let hasMore = true

         while (hasMore) {
            console.log(`Fetching records from API ${after}`)
            const modlogEntries = await reddit.getModLog(subreddit, 500, after)
            console.log(`Fetched ${modlogEntries.size} records from API`)
            if (modlogEntries.length === 0) {
               hasMore = false
            } else {
               // Check if we have reached the end time
               if (
                  modlogEntries.some(
                     (entry) => entry.data.created_utc > specificEndTime
                  )
               ) {
                  hasMore = false
               }
               // Add entries to the list
               allEntries = allEntries.concat(
                  modlogEntries.filter(
                     (entry) => entry.data.created_utc >= specificStartTime
                     // && entry.data.created_utc <= specificEndTime
                  )
               )
               after = modlogEntries[modlogEntries.length - 1].data.id
            }
         }
         console.log(allEntries)
         analyzeModlog(allEntries, logger)
      } catch (error) {
         console.error('Error:', error)
      }
   },
})
