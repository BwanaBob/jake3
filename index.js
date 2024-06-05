require("dotenv").config();
global.options = require("./src/options.js");
global.logger = require("./src/logger.js");
const { startPolling, setJobFrequency, setPollingInterval } = require('./src/reddit/reddit.js');

// const myVariable = process.env.MY_VARIABLE;

async function main() {
    await startPolling();

    // // Example: Changing the frequency of the newPosts job to 200 seconds
    // setTimeout(() => {
    //     setJobFrequency('newPosts', 200);
    // }, 15000); // Change frequency after 15 seconds

    // // Example: Changing the polling interval to every 10 seconds
    // setTimeout(() => {
    //     setPollingInterval('*/10 * * * * *');
    // }, 20000); // Change polling interval after 20 seconds
}

main().catch(console.error);