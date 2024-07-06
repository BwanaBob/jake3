const schedule = require('node-schedule')
const EventEmitter = require('events')
const fs = require('fs')
const path = require('path')
const logger = require('./Logger')

class Scheduler extends EventEmitter {
   constructor() {
      super()
      this.jobs = {}
   }

   async scheduleJob(name, cronExpression, jobFunction) {
      const scheduledJob = schedule.scheduleJob(cronExpression, async () => {
         try {
            const result = await jobFunction();
            this.emit('jobCompleted', name, result);
         } catch (error) {
            this.emit('jobError', name, error);
         }
      });
      this.jobs[name] = { scheduledJob, jobFunction };
      this.emit('jobScheduled', name, cronExpression);
   }

   cancelJob(name) {
      if (this.jobs[name]) {
         this.jobs[name].cancel()
         delete this.jobs[name]
         // logger.info(`Job "${name}" cancelled`)
         this.emit('jobCancelled', name)
      }
   }

   loadJobsFromFolder(folderPath, dependencies) {
      fs.readdir(folderPath, (err, files) => {
         if (err) {
            logger.info(`Error reading jobs folder: ${err}`)
            return
         }

         files.forEach((file) => {
            if (path.extname(file) === '.js') {
               const jobFactory = require(path.join(folderPath, file))
               const job = jobFactory(dependencies)
               this.scheduleJob(job.name, job.cronExpression, job.jobFunction)
            }
         })
      })
   }

   async runJobNow(name) {
      if (this.jobs[name]) {
         try {
            const result = await this.jobs[name].jobFunction()
            this.emit('jobCompleted', name, result)
            return result
         } catch (error) {
            this.emit('jobError', name, error)
            throw error
         }
      } else {
         throw new Error(`Job "${name}" not found.`)
      }
   }
}
const scheduler = new Scheduler()
module.exports = scheduler // export an instance of the class so that the instance is shared across all modules
// module.exports = Scheduler
