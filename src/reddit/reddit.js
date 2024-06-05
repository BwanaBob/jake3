const schedule = require("node-schedule");
// const { info: logEnter } = require("../logger/logger.js");
let pollingJob;
let pollingInterval = "*/7 * * * * *"; // Default polling interval: every 7 seconds

async function startPolling() {
  schedulePollingJob();
}

function schedulePollingJob() {
  if (pollingJob) {
    pollingJob.cancel();
  }
  pollingJob = schedule.scheduleJob(pollingInterval, async () => {
    logger.info({
      emoji: "⏲️",
      module: "CRON",
      feature: "Polling Job",
      message: `CRON job executed`,
    });
  });
}

module.exports = {
  startPolling,
};
