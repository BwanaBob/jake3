const axios = require('axios')
const qs = require('qs')
const axiosRateLimit = require('axios-rate-limit')
const {
   redditClientId,
   redditClientSecret,
   redditUserAgent,
   redditUsername,
   redditPassword,
} = require('../credentials')
const logger = require('./Logger')
const { axiosDefaultRequests, axiosDefaultRequestsMS } = require('../config')

class Reddit {
   constructor() {
      this.baseURL = 'https://oauth.reddit.com'
      this.tokenURL = 'https://www.reddit.com/api/v1/access_token'
      this.client = axiosRateLimit(axios.create({ baseURL: this.baseURL }), {
         maxRequests: axiosDefaultRequests,
         perMilliseconds: axiosDefaultRequestsMS,
      })
      // this.logger = new Logger()
      this.token = null
      this.tokenExpiresAt = null
   }

   _handleRateLimitHeaders(headers) {
      const rateLimitRemaining = headers['x-ratelimit-remaining']
         ? parseFloat(headers['x-ratelimit-remaining'])
         : null
      const rateLimitReset = headers['x-ratelimit-reset']
         ? parseFloat(headers['x-ratelimit-reset'])
         : null

      if (rateLimitRemaining !== null && rateLimitReset !== null) {
         const perMilliseconds = rateLimitReset * 1000 // Convert seconds to milliseconds
         const maxRequests = rateLimitRemaining
         // console.log(
         //    `Reddit API: Setting rate limit to ${maxRequests} per ${
         //       perMilliseconds / 1000
         //    } seconds (Reddit provided)`
         // )
         this.http = axiosRateLimit(axios.create(), {
            maxRequests,
            perMilliseconds,
         })
      } else {
         // Default rate limit
         // console.log(
         //    '\x1b[33m%s\x1b[0m',
         //    `Reddit API: Setting rate limit to ${axiosDefaultRequests} per ${
         //       axiosDefaultRequestsMS / 1000
         //    } seconds (Default)`
         // )

         logger.info({
            emoji: '📡',
            columns: [
               'Reddit API',
               'Rate Limit',
               'Default',
               `Set limit to ${axiosDefaultRequests} per ${
                  axiosDefaultRequestsMS / 1000
               } seconds`,
            ],
         })

         this.http = axiosRateLimit(axios.create(), {
            maxRequests: axiosDefaultRequests,
            perMilliseconds: axiosDefaultRequestsMS,
         }) // 1 request per second
      }
   }

   async getOAuthToken() {
      const auth = Buffer.from(
         `${redditClientId}:${redditClientSecret}`
      ).toString('base64')
      try {
         const response = await axios.post(
            this.tokenURL,
            qs.stringify({
               grant_type: 'password',
               username: redditUsername,
               password: redditPassword,
               // scope: 'read modposts modmail modconfig modflair modlog modcontributors submit privatemessages' // Add necessary scopes here
            }),
            {
               headers: {
                  Authorization: `Basic ${auth}`,
                  'Content-Type': 'application/x-www-form-urlencoded',
                  'User-Agent': redditUserAgent,
               },
            }
         )
         this.token = response.data.access_token
         this.tokenExpiresAt = Date.now() + response.data.expires_in * 1000 // Store the expiry time
         this.client.defaults.headers.common[
            'Authorization'
         ] = `Bearer ${this.token}`
         this.client.defaults.headers.common['User-Agent'] = redditUserAgent // Ensure User-Agent is set
      } catch (error) {
         console.error(
            'Reddit API: Error fetching OAuth token:',
            error.response ? error.response.data : error.message
         )
         throw error
      }
   }

   async ensureValidToken() {
      if (!this.token) {
         // console.log(
         //    '\x1b[33m%s\x1b[0m',
         //    `Reddit API: Retrieving initial token.`
         // )

         logger.info({
            emoji: '📡',
            columns: ['Reddit API', 'Get Token', `Retrieving initial token.`],
         })

         await this.getOAuthToken()
      } else if (Date.now() >= this.tokenExpiresAt) {
         // console.log(
         //    '\x1b[33m%s\x1b[0m',
         //    `Reddit API: Token expiring. Retrieving new token.`
         // )

         logger.info({
            emoji: '📡',
            columns: [
               'Reddit API',
               'Refresh Token',
               `Token Expiring. Retrieving fresh token.`,
            ],
         })

         await this.getOAuthToken()
      }
   }

   async apiRequest(endpoint, method = 'get', data = {}) {
      await this.ensureValidToken()
      try {
         const config = {
            url: endpoint,
            method: method,
            headers: {
               'Content-Type': 'application/x-www-form-urlencoded',
            },
         }

         if (method === 'post') {
            config.data = qs.stringify(data)
         } else {
            config.params = data
         }

         const response = await this.client.request(config)
         this._handleRateLimitHeaders(response.headers)
         // console.log(response);
         return response.data
      } catch (error) {
         if (error.response && error.response.status === 401) {
            // Unauthorized error, token might be expired
            console.warn(
               `Reddit API: 401 Unauthorized error. Retrieving new token.`
            )
            await this.getOAuthToken()
            return this.apiRequest(endpoint, method, data) // Retry the request
         } else if (error.response && error.response.status === 429) {
            // Rate limit error
            console.warn(
               `Reddit API: 429 Rate limit exceeded. Retrying after ${retryAfter} seconds.`
            )
            const retryAfter = error.response.headers['retry-after']
            await new Promise((resolve) =>
               setTimeout(resolve, retryAfter * 1000)
            ) // Wait and retry
            return this.apiRequest(endpoint, method, data) // Retry the request
         } else {
            console.error(
               `Reddit API: Error fetching data from ${endpoint}:`,
               error.response ? error.response.data : error.message
               // error
            )
            throw error
         }
      }
   }

   async getSubredditPosts(subreddit, limit = 25) {
      const data = await this.apiRequest(`/r/${subreddit}/hot.json`, 'get', {
         limit,
      })
      return data.data.children
   }

   async getSubredditFlairs(subreddit) {
      return await this.apiRequest(`/r/${subreddit}/api/link_flair_v2`, 'get')
   }

   async getSubredditSettings(subreddit) {
      return await this.apiRequest(`/r/${subreddit}/about/edit`, 'get')
   }

   // async getNewModMail(subreddit, limit = 5) {
   //    const response = await this.apiRequest(`/api/mod/conversations`, 'get',  { entity: subreddit, sort: 'recent', state: 'all', limit })
   //    console.log(response);
   //    return response
   // }

   async fetchAllModmailConversations() {
      try {
         const response = await this.apiRequest(
            '/api/mod/conversations',
            'get',
            { state: 'inbox' }
         )
         //   console.log(response);
         return response
      } catch (error) {
         console.error('Error fetching modmail conversations:', error.message)
         return response
      }
   }

   //  async fetchAllModmailConversations-old() {
   //    try {
   //      const { conversations, conversationIds } = await this.apiRequest('/api/mod/conversations', 'get', { state: 'inbox' });
   //    //   console.log(conversations['1xjdr2']);
   //      return { conversations, conversationIds };
   //    } catch (error) {
   //      console.error('Error fetching modmail conversations:', error.message);
   //      return { conversations: {}, conversationIds: [] };
   //    }
   //  }

   //  async fetchModmailMessages(conversationId) {
   //    try {
   //      const { conversation } = await this.apiRequest(`/api/mod/conversations/${conversationId}`, 'get');
   //    //   console.log(conversation)
   //      return conversation.messages || [];
   //    } catch (error) {
   //      console.error(`Error fetching messages for conversation ${conversationId}:`, error.message);
   //      return [];
   //    }
   //  }

   async getOneComment(subreddit, commentId) {
      const data = await this.apiRequest(
         `/api/info?id=t1_${commentId}`,
         'get',
         { comment: commentId }
      )
      // console.log(data.data.children)
      return data.data.children
   }
   async getNewComments(subreddit, limit = 25) {
      const data = await this.apiRequest(
         `/r/${subreddit}/comments.json`,
         'get',
         { sort: 'new', limit }
      )
      return data.data.children
   }

   async getNewPosts(subreddit, limit = 25) {
      const data = await this.apiRequest(`/r/${subreddit}/new.json`, 'get', {
         limit,
      })
      // console.log(data.data.children);
      return data.data.children
   }

   async getNewReports(subreddit, limit = 10) {
      const data = await this.apiRequest(
         `/r/${subreddit}/about/reports`,
         'get',
         { limit }
      )
      return data.data.children
   }

   async getNewSpam(subreddit, limit = 10) {
      const data = await this.apiRequest(`/r/${subreddit}/about/spam`, 'get', {
         limit,
      })
      return data.data.children
   }

   async getNewModQueue(subreddit, limit = 10) {
      const data = await this.apiRequest(
         `/r/${subreddit}/about/modqueue`,
         'get',
         { limit }
      )
      return data.data.children
   }

   async getNewUnmoderated(subreddit, limit = 10) {
      const data = await this.apiRequest(
         `/r/${subreddit}/about/unmoderated`,
         'get',
         { limit }
      )
      return data.data.children
   }

   async getNewEdited(subreddit, limit = 10) {
      const data = await this.apiRequest(
         `/r/${subreddit}/about/edited`,
         'get',
         { limit }
      )
      return data.data.children
   }

   async getPostById(postId) {
      const data = await this.apiRequest(`/api/info?id=t3_${postId}`, 'get')
      return data.data.children
   }

   async searchPosts(subreddit, query, limit = 25) {
      const data = await this.apiRequest(`/r/${subreddit}/search.json`, 'get', {
         q: query,
         restrict_sr: true,
         sort: 'new',
         limit,
      })
      return data.data.children
   }

   async getModLog(subreddit, limit = 10, after) {
      const data = await this.apiRequest(`/r/${subreddit}/about/log`, 'get', {
         limit,
         after,
         // mod,
         // show: 'all',
         // type,
      })
      return data.data.children
   }

   async getTempBans(subreddit, limit = 25) {
      const data = await this.apiRequest(
         `/r/${subreddit}/about/banned`,
         'get',
         {
            limit,
            // after,
            // mod,
            // show: 'all',
         }
      )
      // console.log(data.data.children);
      return data.data.children
   }

   async getCommentsForPost(postId, limit = 100) {
      const data = await this.apiRequest(`/comments/${postId}.json`, 'get', {
         sort: 'top',
         limit,
      })
      return data[1].data.children // Comments are in the second element of the response array
   }

   async getAllCommentsForPost(postId) {
      let allComments = []
      let after = null
      let fetchMoreComments = true

      while (fetchMoreComments) {
         const data = await this.apiRequest(`/comments/${postId}.json`, 'get', {
            limit: 100,
            after,
         })
         const comments = data[1].data.children
         allComments = allComments.concat(comments)

         after = data[1].data.after
         fetchMoreComments = !!after
      }

      return allComments
   }

   async getSubredditUserFlairs(subreddit, limit = 100) {
      let allFlairs = []
      let after = null

      do {
         const response = await this.apiRequest(
            `/r/${subreddit}/api/user_flair_v2`,
            'get',
            { limit, after }
         )
// console.log(response[0]);
         if (response ) {
            allFlairs = allFlairs.concat(response)
            after = response.after // Move to the next page if there's a cursor to the next page
         } else {
            after = null
         }
      } while (after)
// console.log(allFlairs)
      return allFlairs
   }

   async getUsersWithFlairs(subreddit, limit = 1000) {
      const usersWithFlairs = []

      let after = null
      do {
         const response = await this.apiRequest(
            `/r/${subreddit}/api/flairlist`,
            'get',
            { limit, after , show: 'all'}
         )
         // console.log(response);
         const users = response.users

         usersWithFlairs.push(...users)
         after = response.after // Set 'after' to the token for the next page
      } while (after)
      // console.log(usersWithFlairs)
      return usersWithFlairs
   }

   async updatePostFlair(postId, flairTemplateId, flairText = '') {
      const endpoint = `/api/selectflair`
      const data = {
         api_type: 'json',
         link: `t3_${postId}`,
         flair_template_id: flairTemplateId,
         text: flairText,
      }
      await this.apiRequest(endpoint, 'post', data)
   }

   async updatePostSticky(postId, isSticky = true, slot = 1) {
      const endpoint = `/api/set_subreddit_sticky`
      const data = {
         id: `t3_${postId}`,
         state: isSticky,
         num: slot,
      }
      await this.apiRequest(endpoint, 'post', data)
   }

   async distinguishComment(commentId) {
      const endpoint = `/api/distinguish`
      const data = {
         id: `t1_${commentId}`,
         how: 'yes',
         // sticky,
      }
      await this.apiRequest(endpoint, 'post', data)
   }
}

const reddit = new Reddit()
module.exports = reddit // export an instance of the class so that the instance is shared across all modules
// module.exports = Reddit
