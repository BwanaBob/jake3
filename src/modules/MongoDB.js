const { MongoClient } = require('mongodb');

class MongoDB {
   constructor(uri, dbName) {
      this.uri = uri;
      this.dbName = dbName;
      this.client = new MongoClient(this.uri, { useNewUrlParser: true, useUnifiedTopology: true });
      this.db = null;
   }

   async connect() {
      try {
         await this.client.connect();
         console.log('Connected to MongoDB');
         this.db = this.client.db(this.dbName);
      } catch (error) {
         console.error('Error connecting to MongoDB:', error);
         throw error;
      }
   }

   async disconnect() {
      try {
         await this.client.close();
         console.log('Disconnected from MongoDB');
      } catch (error) {
         console.error('Error disconnecting from MongoDB:', error);
         throw error;
      }
   }

   async insertComment(comment) {
      try {
         const collection = this.db.collection('comments');
         const result = await collection.insertOne(comment);
         return result;
      } catch (error) {
         console.error('Error inserting comment:', error);
         throw error;
      }
   }

   async findComments(query = {}, limit = 100) {
      try {
         const collection = this.db.collection('comments');
         const comments = await collection.find(query).limit(limit).toArray();
         return comments;
      } catch (error) {
         console.error('Error finding comments:', error);
         throw error;
      }
   }

   async updateComment(commentId, update) {
      try {
         const collection = this.db.collection('comments');
         const result = await collection.updateOne({ _id: commentId }, { $set: update });
         return result;
      } catch (error) {
         console.error('Error updating comment:', error);
         throw error;
      }
   }

   async deleteComment(commentId) {
      try {
         const collection = this.db.collection('comments');
         const result = await collection.deleteOne({ _id: commentId });
         return result;
      } catch (error) {
         console.error('Error deleting comment:', error);
         throw error;
      }
   }
}

module.exports = MongoDB;
