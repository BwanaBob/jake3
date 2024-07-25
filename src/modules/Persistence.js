const config = require('../config')

class Persistence {
   constructor() {
      super()
      this.submissions = {}
      this.modLogs = {}
      this.messages = {}
   }

   saveSubmission(newSubmission) {
      const savedDate = new Date()
      newSubmission.lastUpdated = savedDate
      this.submissions[newSubmission.id] = {
         ...this.submissions[newSubmission.id],
         ...newSubmission,
      }
   }

   getSubmission(submission) {
      return this.submissions[submission.id]
   }

   saveMessage(newMessage) {
      const savedDate = new Date()
      newMessage.lastUpdated = savedDate
      this.messages.push(newMessage)
   }

   deleteMessage(messageId) {
      delete this.messages[messageId]
   }



   getSubmissionMessages(submissionId){}
   getSubmissionModLogs(submissionId){}

}
const persistence = new Persistence()
module.exports = persistence // export an instance of the class so that the instance is shared across all modules
