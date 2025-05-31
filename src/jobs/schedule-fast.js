const scheduler = require('../modules/Scheduler')

module.exports = () => ({
   name: 'scheduleFast',
   cronExpression: '0 55 17 * * FRI,SAT', // pre-thread posting - live
   // cronExpression: '0 49 10 * * MON', // today, once - testing

   jobFunction: async () => {
      const jobs = [
         { name: 'getNewModLog',   cronExpression: '13,43 * * * * *' },
         { name: 'getNewComments', cronExpression: '0,7,15,22,30,37,45,52 * * * * *' },
         { name: 'getNewModMail',  cronExpression: '11,41 * * * * *' },
         { name: 'getNewModQueue', cronExpression: '4,19,34,49 * * * * *' },
         { name: 'getNewPosts',    cronExpression: '26,56 * * * * *' },
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
