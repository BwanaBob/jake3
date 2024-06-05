module.exports = {
    info(logData) {
        if (typeof logData === 'string' || logData instanceof String) {
            const newLog = { message: logData };
            logData = newLog;
        }
        if (!logData.date) { logData.date = new Date().toLocaleString() }
        if (!logData.color) { logData.color = '\x1b[33m%s\x1b[0m' }

        var logString = `[${logData.date.padEnd(options.logger.dateLength)}] `;
        if (logData.emoji) { logString += `${logData.emoji} `; }
        if (logData.module) { logString += `${logData.module.slice(0, options.logger.moduleLength).padEnd(options.logger.moduleLength)}| `; }
        if (logData.feature) { logString += `${logData.feature.slice(0, options.logger.featureLength).padEnd(options.logger.featureLength)} | ` };
        if (logData.guild) { logString += `${logData.guild.slice(0, options.logger.guildLength).padEnd(options.logger.guildLength)} | ` };
        if (logData.channel) { logString += `${logData.channel.slice(0, options.logger.channelLength).padEnd(options.logger.channelLength)} | ` };

        if (logData.userName || logData.nickname) {
            var userString = "";
            if (logData.userName && logData.nickname) {
                userString = `${logData.nickname}/${logData.userName}`
            } else if (logData.userName) {
                userString = logData.userName
            } else if (logData.nickname) {
                userString = logData.nickname
            }
            logString += `${userString.padEnd(options.logger.userLength)} | `
        }
        // if (log.userName) { logString += `${log.userName.padEnd(options.logger.userLength)} | ` };
        // if (log.nickname) { logString += `${log.nickname.padEnd(options.logger.userLength)} | ` };

        if (logData.message) { logString += `${logData.message}` };

        console.log(
            logData.color, logString
                .replace(/(\r?\n|\r)/gm, " ")
                .slice(0, options.logger.logLength)
        );
    }
};
