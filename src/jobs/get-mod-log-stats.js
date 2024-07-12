const reddit = require('../modules/Reddit') // shared instance
const logger = require('../modules/Logger') // shared instance
// const logger = new Logger()

const config = require('../config')
const { subreddit, startDate, startTime, endDate, endTime } =
   config.jobs.getModLogStats

// Helper function to get the timestamp for the specified date and time
const getSpecificTime = (date, time) => {
   const [year, month, day] = date.split('-').map(Number)
   const [hours, minutes, seconds] = time.split(':').map(Number)
   return Math.floor(
      new Date(year, month - 1, day, hours, minutes, seconds).getTime() / 1000
   )
}

// Function to analyze the modlog entries
const analyzeModlog = (entries, specificEndTime, logger) => {
   const autoModRemovals = {}
   const sortedEntries = entries.sort(function (a, b) {
      return a.data.created_utc - b.data.created_utc
   }) // sort activity so that only the latest approval/removal counts

   // Track AutoModerator removals
   sortedEntries.forEach((entry) => {
      if (
         entry.data.mod === 'AutoModerator' &&
         entry.data.action === 'removecomment' &&
         entry.data.created_utc <= specificEndTime // filter candidates by end time, but not later approvals and removals
      ) {
         autoModRemovals[entry.data.target_fullname] = {
            details: entry.data.details,
            approved: false,
            removed: false,
         }
      }
   })

   // Track subsequent actions by human moderators
   // sort output for clarity
   sortedEntries.forEach((entry) => {
      const targetId = entry.data.target_fullname
      if (autoModRemovals[targetId]) {
         if (
            entry.data.mod !== 'AutoModerator' &&
            entry.data.action === 'approvecomment'
         ) {
            autoModRemovals[targetId].approved = true
            autoModRemovals[targetId].removed = false
         } else if (
            entry.data.mod !== 'AutoModerator' &&
            entry.data.action === 'removecomment'
         ) {
            autoModRemovals[targetId].removed = true
            autoModRemovals[targetId].approved = false
         }
      }
   })

   // Group and display results
   const groupedEntries = Object.values(autoModRemovals).reduce(
      (acc, entry) => {
         let ruleDetail = entry.details.toLowerCase()
         const bracketRegex = /\[(.*?)\]/ // Add a capturing group
         let match = ruleDetail.match(bracketRegex)

         if (match) {
            ruleDetail = match[1] // match[1] will contain the text inside the brackets
         }

         if (!acc[ruleDetail]) {
            acc[ruleDetail] = { approved: 0, removed: 0, ruleCount: 0 }
         }
         if (entry.approved) {
            acc[ruleDetail].approved++
            acc[ruleDetail].ruleCount++
         }
         if (entry.removed) {
            acc[ruleDetail].removed++
            acc[ruleDetail].ruleCount++
         }
         return acc
      },
      {}
   )

   const sortedGroupedEntries = Object.entries(groupedEntries).sort((a, b) => {
      const ruleDetailA = a[0].toUpperCase() // Ignore upper and lowercase
      const ruleDetailB = b[0].toUpperCase() // Ignore upper and lowercase
      if (ruleDetailA < ruleDetailB) {
         return -1
      }
      if (ruleDetailA > ruleDetailB) {
         return 1
      }
      return 0 // names must be equal
   })

   for (const [ruleDetail, counts] of sortedGroupedEntries) {
      const total = counts.approved + counts.removed
      const approvedPercentage = (counts.approved / total) * 100
      const removedPercentage = (counts.removed / total) * 100
      logger.info({
         emoji: '📋',
         columns: [
            'Mod Log',
            {
               min: 3,
               max: 3,
               text: `${counts.ruleCount}`,
            },
            {
               min: 13,
               max: 13,
               text: `✅ ${counts.approved} (${approvedPercentage.toFixed(
                  1
               )}%)`,
            },
            {
               min: 13,
               max: 13,
               text: `⛔ ${counts.removed} (${removedPercentage.toFixed(1)}%)`,
            },
            ruleDetail,
         ],
      })
      //   console.log(`✅ ${counts.approved}/${counts.removed} ⛔ (${approvedPercentage.toFixed(2)}% / ${removedPercentage.toFixed(2)}%) - Rule: ${ruleDetail}`);
   }
   return sortedGroupedEntries;
}

module.exports = () => ({
   name: 'getModLogStats',

   cronExpression: '0 0 12 1 1 *', // noon 1/1 (Park It)
   // cronExpression: '0 * * * * *', // Every 1 minucd co   te (testing)

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
         // console.log(allEntries)
         const results = analyzeModlog(allEntries, specificEndTime, logger)
         return {status: 'success', data: results};
      } catch (error) {
         console.error('Error:', error)
      }
   },
})
