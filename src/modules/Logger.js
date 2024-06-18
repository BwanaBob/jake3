const config = require('../config')

class Logger2 {
   info(logData) {
      const nowDate = new Date().toLocaleString()
      if (typeof logData === 'string' || logData instanceof String) {
         const newLog = { columns: [{ text: logData }] }
         logData = newLog
      }

      if (typeof logData === 'array' || logData instanceof Array) {
         const newLog = { columns: logData }
         logData = newLog
      }

      if (!logData.columns && logData.text) {
         const newLog = { columns: [logData.text] }
         logData = newLog
      }

      if (!logData.columns) {
         logData.columns = ["No log data provided"]
      }


      if (!logData.date) {
         logData.date = nowDate
      }

      if (!logData.color) {
         logData.color = '\x1b[33m%s\x1b[0m'
      }

      if (!logData.emoji) {
        logData.emoji = '🐶'
     }

     let logString = `[${logData.date.padEnd(config.logger.dateLength)}] `

      if (logData.emoji) {
         logString += `${logData.emoji} `
      }

      logData.columns.forEach((column, index) => {
         const isLast = index === logData.columns.length - 1
         if (typeof column === 'string' || column instanceof String) {
            const newCol = { text: column }
            column = newCol
         }

         if (isLast) {
            logString += column.text
         } else {
            let thisMin = config.logger.columns[index].min || 12
            let thisMax = config.logger.columns[index].max || 12
            if (column.min) {
               thisMin = column.min
            }
            if (column.max) {
               thisMax = column.max
            }
            logString += column.text.slice(0, thisMax).padEnd(thisMin)
            logString += '| '
         }
      })

      console.log(
         logData.color,
         logString
            .replace(/(\r?\n|\r)/gm, ' ')
            .slice(0, config.logger.logLength)
      )
   }
}

module.exports = Logger2
