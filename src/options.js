const fs = require('fs');
const path = require('path');

// Read and parse the options JSON file from the root directory
const optionsPath = path.join(__dirname, '../options.json');
const options = JSON.parse(fs.readFileSync(optionsPath, 'utf8'));

module.exports = options;
