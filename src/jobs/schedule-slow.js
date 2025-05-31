const scheduler = require('../modules/Scheduler')

module.exports = () => ({
   name: 'scheduleSlow',
   cronExpression: '0 05 23 * * FRI,SAT', // pre-thread posting - live
   // cronExpression: '0 17 11 * * MON', // today, once - testing

   jobFunction: async () => {
      const jobs = [
         { name: 'getNewModLog',   cronExpression: '13 * * * * *' },
         { name: 'getNewComments', cronExpression: '22,52 * * * * *' },
         { name: 'getNewModMail',  cronExpression: '41 * * * * *' },
         { name: 'getNewModQueue', cronExpression: '4,34 * * * * *' },
         { name: 'getNewPosts',    cronExpression: '26 * * * * *' },
      ]

      try {
         jobs.forEach((job) => {
            scheduler.updateJob(job.name, job.cronExpression)
         })
         return { status: 'success' }
      } catch (error) {
         console.error(`[${new Date().toLocaleString()}] [scheduleStart] Error scheduling job:`, error.message)
         throw error
      }
   },
})
