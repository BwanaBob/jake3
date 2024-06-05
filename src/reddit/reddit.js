const EventEmitter = require('events')
const schedule = require('node-schedule')

class Reddit extends EventEmitter {
    constructor() {
        super()
        this.pollingInterval = '0/7 * * * * *' // Default polling interval: every 7 seconds
        this.pollingJob = null
    }

    async startPolling() {
        this._schedulePollingJob()
    }

    setPollingInterval(newInterval) {
        this.pollingInterval = newInterval
        logger.info({
            emoji: '⏲️',
            module: 'Scheduler',
            feature: 'Set Interval',
            message: `${this.pollingInterval}`,
        })
        this._schedulePollingJob()
    }

    _schedulePollingJob() {
        if (this.pollingJob) {
            this.pollingJob.cancel()
        }
        this.pollingJob = schedule.scheduleJob(
            this.pollingInterval,
            async () => {
                this.emit('pollingIteration')
            }
        )
    }
}

module.exports = Reddit
