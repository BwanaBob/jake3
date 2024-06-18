const schedule = require('node-schedule')
const EventEmitter = require('events')
const fs = require('fs')
const path = require('path')
const Logger = require('./Logger')

class Scheduler extends EventEmitter {
   constructor() {
      super()
      this.jobs = {}
      this.logger = new Logger()
   }

   async scheduleJob(name, cronExpression, jobFunction) {
      const job = schedule.scheduleJob(cronExpression, async () => {
         try {
            const result = await jobFunction();
            this.emit("jobCompleted", name, result);
         } catch (error) {
            this.emit("jobError", name, error);
         }
      });
      this.jobs[name] = job;
      this.emit("jobScheduled", name, cronExpression);
   }

   cancelJob(name) {
      if (this.jobs[name]) {
         this.jobs[name].cancel()
         delete this.jobs[name]
         // this.logger.info(`Job "${name}" cancelled`)
         this.emit("jobCancelled", name)
      }
   }

   loadJobsFromFolder(folderPath, dependencies) {
      fs.readdir(folderPath, (err, files) => {
         if (err) {
            this.logger.info(`Error reading jobs folder: ${err}`)
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
}

module.exports = Scheduler
