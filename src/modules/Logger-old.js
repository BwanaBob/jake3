const config = require('../config')

class Logger {
    info(logData) {
        if (typeof logData === 'string' || logData instanceof String) {
            const newLog = { message: logData }
            logData = newLog
        }
        if (!logData.date) {
            logData.date = new Date().toLocaleString()
        }
        if (!logData.color) {
            logData.color = '\x1b[33m%s\x1b[0m'
        }

        let logString = `[${logData.date.padEnd(config.logger.dateLength)}] `
        if (logData.emoji) {
            logString += `${logData.emoji} `
        }
        if (logData.module) {
            logString += `${logData.module
                .slice(0, config.logger.moduleLength)
                .padEnd(config.logger.moduleLength)}| `
        }
        if (logData.feature) {
            logString += `${logData.feature
                .slice(0, config.logger.featureLength)
                .padEnd(config.logger.featureLength)} | `
        }
        if (logData.guild) {
            logString += `${logData.guild
                .slice(0, config.logger.guildLength)
                .padEnd(config.logger.guildLength)} | `
        }
        if (logData.channel) {
            logString += `${logData.channel
                .slice(0, config.logger.channelLength)
                .padEnd(config.logger.channelLength)} | `
        }

        if (logData.userName || logData.nickname) {
            let userString = ''
            if (logData.userName && logData.nickname) {
                userString = `${logData.nickname}/${logData.userName}`
            } else if (logData.userName) {
                userString = logData.userName
            } else if (logData.nickname) {
                userString = logData.nickname
            }
            logString += `${userString.padEnd(config.logger.userLength)} | `
        }

        if (logData.message) {
            logString += `${logData.message}`
        }

        console.log(
            logData.color,
            logString
                .replace(/(\r?\n|\r)/gm, ' ')
                .slice(0, config.logger.logLength)
        )
    }
}

module.exports = Logger
