require("dotenv").config();
global.options = require("./src/options.js");
global.logger = require("./src/logger.js");
// const { startPolling, setJobFrequency, setPollingInterval } = require('./src/reddit/reddit.js');
const Reddit = require('./src/reddit/reddit.js')
// const myVariable = process.env.MY_VARIABLE;

async function main() {
    const reddit = new Reddit();


    reddit.on('pollingIteration', () => {
        logger.info({
            emoji: '⏱️',
            module: 'Scheduler',
            feature: 'Poll',
            message: `CRON job executed`,
        })
    });


    await reddit.startPolling();

    // // Example: Changing the frequency of the newPosts job to 200 seconds
    // setTimeout(() => {
    //     setJobFrequency('newPosts', 200);
    // }, 15000); // Change frequency after 15 seconds

    // Example: Changing the polling interval to every 10 seconds
    setTimeout(() => {
        reddit.setPollingInterval('0/10 * * * * *');
    }, 40000); // Change polling interval after 40 seconds
}

main().catch(console.error);