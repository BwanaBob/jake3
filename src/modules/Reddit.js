const axios = require('axios')
const axiosRateLimit = require('axios-rate-limit')
const {
   redditClientId,
   redditClientSecret,
   redditUserAgent,
   redditUsername,
   redditPassword,
} = require('../config')
const qs = require('qs')
const Logger = require('./Logger')
const logger = new Logger()

class Reddit {
   constructor() {
      this.baseURL = 'https://oauth.reddit.com'
      this.tokenURL = 'https://www.reddit.com/api/v1/access_token'
      this.client = axiosRateLimit(axios.create({ baseURL: this.baseURL }), {
         maxRequests: 60,
         perMilliseconds: 60000,
      })
      this.token = null
      this.tokenExpiresAt = null
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
         console.log('OAuth token obtained:', this.token) // Log the token for debugging
      } catch (error) {
         console.error(
            'Error fetching OAuth token:',
            error.response ? error.response.data : error.message
         )
         throw error
      }
   }

   async ensureValidToken() {
      if (!this.token || Date.now() >= this.tokenExpiresAt) {
         await this.getOAuthToken()
      }
   }

   async getSubredditPosts(subreddit, limit = 25) {
      await this.ensureValidToken()
      try {
         const response = await this.client.get(`/r/${subreddit}/hot.json`, {
            params: { limit },
         })
         logger.info({
            emoji: '⏲️',
            module: 'Reddit',
            feature: 'Get Posts',
            message: `${response.status}-${response.statusText} ${response.headers['x-ratelimit-used']}/${response.headers['x-ratelimit-remaining']}-${response.headers['x-ratelimit-reset']} Expires: ${response.headers['expires']}`,
         })
         return response.data.data.children
      } catch (error) {
         if (error.response && error.response.status === 401) {
            // Unauthorized error, token might be expired
            await this.getOAuthToken()
            return this.getSubredditPosts(subreddit, limit) // Retry the request
         } else if (error.response && error.response.status === 429) {
            // Rate limit error
            const retryAfter = error.response.headers['retry-after']
            console.warn(
               `Rate limit exceeded. Retrying after ${retryAfter} seconds.`
            )
            await new Promise((resolve) =>
               setTimeout(resolve, retryAfter * 1000)
            ) // Wait and retry
            return this.getSubredditPosts(subreddit, limit) // Retry the request
         } else {
            console.error(
               'Error fetching subreddit posts:',
               error.response ? error.response.data : error.message
            )
            throw error
         }
      }
   }

   async getSubredditSettings(subreddit) {
      await this.ensureValidToken()
      try {
         const response = await this.client.get(`/r/${subreddit}/about/edit`)
         return response.data // Access the subreddit details
      } catch (error) {
         if (error.response && error.response.status === 401) {
            // Unauthorized error, token might be expired
            await this.getOAuthToken()
            return this.getSubredditSettings(subreddit) // Retry the request
         } else if (error.response && error.response.status === 429) {
            // Rate limit error
            const retryAfter = error.response.headers['retry-after']
            console.warn(
               `Rate limit exceeded. Retrying after ${retryAfter} seconds.`
            )
            await new Promise((resolve) =>
               setTimeout(resolve, retryAfter * 1000)
            ) // Wait and retry
            return this.getSubredditSettings(subreddit) // Retry the request
         } else if (error.response && error.response.status === 403) {
            // Forbidden error, likely due to permissions
            console.error(
               'Access forbidden: Insufficient permissions to access subreddit settings.'
            )
            throw new Error(
               'Access forbidden: Insufficient permissions to access subreddit settings.'
            )
         } else if (error.response && error.response.status === 404) {
            // Not found error
            console.error('Subreddit not found or endpoint incorrect.')
            throw new Error('Subreddit not found or endpoint incorrect.')
         } else {
            console.error(
               'Error fetching subreddit settings:',
               error.response ? error.response.data : error.message
            )
            throw error
         }
      }
   }

   async getNewComments(subreddit, limit = 25) {
      await this.ensureValidToken()
      try {
         const response = await this.client.get(
            `/r/${subreddit}/comments.json`,
            {
               params: { limit },
            }
         )
         return response.data.data.children
      } catch (error) {
         if (error.response && error.response.status === 401) {
            // Unauthorized error, token might be expired
            await this.getOAuthToken()
            return this.getNewComments(subreddit, limit) // Retry the request
         } else if (error.response && error.response.status === 429) {
            // Rate limit error
            const retryAfter = error.response.headers['retry-after']
            console.warn(
               `Rate limit exceeded. Retrying after ${retryAfter} seconds.`
            )
            await new Promise((resolve) =>
               setTimeout(resolve, retryAfter * 1000)
            ) // Wait and retry
            return this.getNewComments(subreddit, limit) // Retry the request
         } else {
            console.error(
               'Error fetching new comments:',
               error.response ? error.response.data : error.message
            )
            throw error
         }
      }
   }
}

module.exports = Reddit
