const { decode } = require('html-entities')
const reddit = require('../modules/Reddit') // shared instance
const logger = require('../modules/Logger') // shared instance
// const logger = new Logger()

const config = require('../config')
const { subreddit, showStartTime, showEndTime } =
   config.jobs.getModLogStats

// Helper function to calculate previous night's show times
// Show airs Friday and Saturday nights from 9pm to 12:30am next day
const getPreviousNightShowTimes = () => {
   const now = new Date()
   
   // Calculate previous night (yesterday)
   const startDate = new Date(now)
   startDate.setDate(startDate.getDate() - 1)
   const [startHours, startMinutes, startSeconds] = showStartTime.split(':').map(Number)
   startDate.setHours(startHours, startMinutes, startSeconds, 0)

   // End time is early morning of current day
   const endDate = new Date(now)
   const [endHours, endMinutes, endSeconds] = showEndTime.split(':').map(Number)
   endDate.setHours(endHours, endMinutes, endSeconds, 0)

   return {
      startTimestamp: Math.floor(startDate.getTime() / 1000),
      endTimestamp: Math.floor(endDate.getTime() / 1000),
      startDateStr: startDate.toLocaleString(),
      endDateStr: endDate.toLocaleString()
   }
}

// Function to analyze the modlog entries
const analyzeModlog = (entries, specificEndTime, logger) => {
   const autoModRemovals = {}
   const sortedEntries = entries.sort(function (a, b) {
      return a.data.created_utc - b.data.created_utc
   }) // sort activity so that only the latest approval/removal counts

   // Track AutoModerator removals
   sortedEntries.forEach((entry) => {
      entry.data.details = decode(entry.data.details)
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
            acc[ruleDetail] = { approved: 0, removed: 0, untouched: 0 }
         }
         // Only count the final state - either approved, removed, or untouched
         if (entry.approved) {
            acc[ruleDetail].approved++
         } else if (entry.removed) {
            acc[ruleDetail].removed++
         } else {
            acc[ruleDetail].untouched++
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
      const total = counts.approved + counts.removed + counts.untouched
      const approvedPercentage = (counts.approved / total) * 100
      const removedPercentage = (counts.removed / total) * 100
      const untouchedPercentage = (counts.untouched / total) * 100
      logger.info({
         emoji: '📋',
         columns: [
            'Mod Log',
            {
               min: 3,
               max: 3,
               text: `${total}`,
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
            {
               min: 13,
               max: 13,
               text: `⏸️ ${counts.untouched} (${untouchedPercentage.toFixed(1)}%)`,
            },
            ruleDetail,
         ],
      })
   }
   return sortedGroupedEntries
}

module.exports = () => ({
   name: 'getModLogStats',

   // cronExpression: '0 0 12 1 1 *', // noon 1/1 (Park It)
   // cronExpression: '0 * * * * *', // Every 1 minute (testing)
   cronExpression: '0 37 1 * * SAT,SUN', // Every Saturday and Sunday at 1:37am (captures Friday and Saturday night shows)

   jobFunction: async () => {
      try {
         const { startTimestamp, endTimestamp, startDateStr, endDateStr } = getPreviousNightShowTimes()
         
         logger.info({
            emoji: '📋',
            columns: ['Mod Log Stats', 'Analyzing', startDateStr, 'to', endDateStr]
         })
         
         const specificStartTime = startTimestamp
         const specificEndTime = endTimestamp

         let after = ''
         let allEntries = []
         let hasMore = true

         while (hasMore) {
            logger.info({
               emoji: '📋',
               columns: ['Mod Log Stats', 'Fetching', after || 'initial batch']
            })
            const modlogEntries = await reddit.getModLog(subreddit, 500, after)
            logger.info({
               emoji: '📋',
               columns: ['Mod Log Stats', 'Fetched', `${modlogEntries.length} records`]
            })
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
         return { status: 'success', data: results }
      } catch (error) {
         logger.info({
            emoji: '❌',
            columns: ['Mod Log Stats', 'Error', error.message]
         })
         return { status: 'error', error: error.message }
      }
   },
})
