const { decode } = require('html-entities')
const reddit = require('../modules/Reddit') // shared instance
const logger = require('../modules/Logger') // shared instance

const config = require('../config')
const { subreddit, showStartTime, showEndTime } =
   config.jobs.getModLogStats

// Constants
const API_BATCH_SIZE = 500
const AUTOMOD_ACTIONS = ['removecomment', 'spamcomment']

// Helper function to calculate previous night's show times
// Show airs Friday and Saturday nights from 9pm to 12:30am next day
const getPreviousNightShowTimes = () => {
   const now = new Date()
   const dayOfWeek = now.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
   
   let daysBack
   if (dayOfWeek === 6) {
      // Saturday morning - analyze Friday night's show (yesterday)
      daysBack = 1
   } else {
      // Any other day - analyze previous Saturday night's show
      // Sunday = 1 day back, Monday = 2 days, ..., Friday = 6 days
      daysBack = dayOfWeek === 0 ? 1 : dayOfWeek + 1
   }
   
   // Calculate start date (Saturday night at 8pm CST)
   const startDate = new Date(now)
   startDate.setDate(startDate.getDate() - daysBack)
   const [startHours, startMinutes, startSeconds] = showStartTime.split(':').map(Number)
   startDate.setHours(startHours, startMinutes, startSeconds, 0)

   // End time is same day at 11pm CST
   const endDate = new Date(startDate)
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
const analyzeModlog = (entries, specificEndTime, logger, threadLink = null) => {
   const autoModRemovals = {}
   const sortedEntries = entries.sort(function (a, b) {
      return a.data.created_utc - b.data.created_utc
   })

   // Show thread link if available
   if (threadLink) {
      logger.info({
         emoji: '🔗',
         columns: ['Thread', threadLink]
      })
   }

   // Track AutoModerator removals (both removecomment and spamcomment)
   sortedEntries.forEach((entry) => {
      // Validate entry has required data
      if (!entry.data) {
         return
      }
      
      if (
         entry.data.mod === 'AutoModerator' &&
         AUTOMOD_ACTIONS.includes(entry.data.action) &&
         entry.data.created_utc <= specificEndTime
      ) {
         // Decode and validate details
         let details = 'unknown reason'
         if (entry.data.details && entry.data.details.trim() !== '') {
            details = decode(entry.data.details)
         }
         
         autoModRemovals[entry.data.target_fullname] = {
            details: details,
            action: entry.data.action,
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
         // Safely handle missing or empty details
         if (!entry.details || entry.details.trim() === '') {
            entry.details = 'unknown reason'
         }
         
         let ruleDetail = entry.details.toLowerCase()
         
         const bracketRegex = /\[(.*?)\]/
         let match = ruleDetail.match(bracketRegex)

         if (match && match[1] && match[1].trim() !== '') {
            ruleDetail = match[1].trim()
         } else {
            // Handle malformed removal reasons without brackets
            ruleDetail = ruleDetail.slice(0, 50).trim() || 'unknown reason'
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
      const ruleDetailA = a[0].toUpperCase()
      const ruleDetailB = b[0].toUpperCase()
      if (ruleDetailA < ruleDetailB) {
         return -1
      }
      if (ruleDetailA > ruleDetailB) {
         return 1
      }
      return 0
   })

   // Calculate and display summary statistics
   let totalActions = 0
   let totalApproved = 0
   let totalRemoved = 0
   let totalUntouched = 0

   for (const [ruleDetail, counts] of sortedGroupedEntries) {
      const actionCount = counts.approved + counts.removed + counts.untouched
      totalActions += actionCount
      totalApproved += counts.approved
      totalRemoved += counts.removed
      totalUntouched += counts.untouched
      
      const approvedPercentage = (counts.approved / actionCount) * 100
      const removedPercentage = (counts.removed / actionCount) * 100
      const untouchedPercentage = (counts.untouched / actionCount) * 100
      logger.info({
         emoji: '📋',
         columns: [
            'Mod Log',
            {
               min: 3,
               max: 3,
               text: `${actionCount}`,
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

   // Display summary
   if (totalActions > 0) {
      const overallApprovalRate = (totalApproved / totalActions) * 100
      const overallRemovalRate = (totalRemoved / totalActions) * 100
      const overallUntouchedRate = (totalUntouched / totalActions) * 100
      
      logger.info({
         emoji: '📊',
         columns: [
            'Summary',
            `Total: ${totalActions}`,
            `✅ ${totalApproved} (${overallApprovalRate.toFixed(1)}%)`,
            `⛔ ${totalRemoved} (${overallRemovalRate.toFixed(1)}%)`,
            `⏸️ ${totalUntouched} (${overallUntouchedRate.toFixed(1)}%)`,
         ],
      })
      
      // Overall assessment
      if (overallApprovalRate > 50) {
         logger.info({
            emoji: '✅',
            columns: ['Assessment', `High approval rate - AutoMod may be too aggressive`]
         })
      } else if (overallUntouchedRate > 30) {
         logger.info({
            emoji: '⚠️',
            columns: ['Assessment', `Many comments not reviewed - check mod queue`]
         })
      }
   }

   return sortedGroupedEntries
}

module.exports = () => ({
   name: 'getModLogStats',

   // cronExpression: '0 0 12 1 1 *', // noon 1/1 (Park It)
   // cronExpression: '0 */2 * * * *', // Every 5 minutes (testing) - TESTING ENABLED
   cronExpression: '0 0 1 * * SAT,SUN', // Every Saturday and Sunday at 1:00am (captures Friday and Saturday night shows)

   jobFunction: async () => {
      try {
         const { startTimestamp, endTimestamp, startDateStr, endDateStr } = getPreviousNightShowTimes()
         
         // Validate timestamps
         if (startTimestamp >= endTimestamp) {
            const errorMsg = 'Invalid time range: start time is after end time'
            logger.info({
               emoji: '❌',
               columns: ['Mod Log Stats', 'Error', errorMsg]
            })
            return { status: 'error', error: errorMsg }
         }
         
         logger.info({
            emoji: '📋',
            columns: ['Mod Log Stats', 'Analyzing', startDateStr, 'to', endDateStr]
         })
         
         const specificStartTime = startTimestamp
         const specificEndTime = endTimestamp

         let after = ''
         let allEntries = []
         let hasMore = true
         let batchCount = 0
         let totalFetched = 0

         while (hasMore) {
            batchCount++
            logger.info({
               emoji: '📋',
               columns: ['Mod Log Stats', `Batch ${batchCount}`, after || 'initial']
            })
            const modlogEntries = await reddit.getModLog(subreddit, API_BATCH_SIZE, after)
            totalFetched += modlogEntries.length
            logger.info({
               emoji: '📋',
               columns: ['Mod Log Stats', 'Fetched', `${modlogEntries.length} records (${totalFetched} total)`]
            })
            
            if (modlogEntries.length === 0) {
               hasMore = false
            } else {
               // More efficient stopping condition: stop if oldest entry in batch is newer than end time
               const oldestEntryTime = modlogEntries[modlogEntries.length - 1].data.created_utc
               if (oldestEntryTime < specificStartTime) {
                  hasMore = false
               }
               
               // Add entries within the time range
               const entriesInRange = modlogEntries.filter(
                  (entry) => entry.data.created_utc >= specificStartTime && entry.data.created_utc <= specificEndTime
               )
               allEntries = allEntries.concat(entriesInRange)
               after = modlogEntries[modlogEntries.length - 1].data.id
            }
         }
         
         logger.info({
            emoji: '📋',
            columns: ['Mod Log Stats', 'Processing', `${allEntries.length} entries in range`]
         })
         
         // Try to find the live thread link from the entries
         let threadLink = null
         const liveThreadEntry = allEntries.find(entry => {
            return entry.data.target_title && 
                   entry.data.target_title.toLowerCase().includes('live thread')
         })
         
         if (liveThreadEntry && liveThreadEntry.data.target_permalink) {
            threadLink = `https://reddit.com${liveThreadEntry.data.target_permalink}`
         } else if (liveThreadEntry && liveThreadEntry.data.target_fullname) {
            // Fallback: construct link from subreddit
            threadLink = `https://reddit.com/r/${subreddit}`
         }
         
         const results = analyzeModlog(allEntries, specificEndTime, logger, threadLink)
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
