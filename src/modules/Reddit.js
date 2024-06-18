const axios = require('axios')
const qs = require('qs')
const axiosRateLimit = require('axios-rate-limit')
const {
   redditClientId,
   redditClientSecret,
   redditUserAgent,
   redditUsername,
   redditPassword,
   axiosDefaultRequests,
   axiosDefaultRequestsMS,
} = require('../config')

class Reddit {
   constructor() {
      this.baseURL = 'https://oauth.reddit.com'
      this.tokenURL = 'https://www.reddit.com/api/v1/access_token'
      this.client = axiosRateLimit(axios.create({ baseURL: this.baseURL }), {
         maxRequests: axiosDefaultRequests,
         perMilliseconds: axiosDefaultRequestsMS,
      })
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
         console.log(
            `Reddit API: Setting rate limit to ${maxRequests} per ${
               perMilliseconds / 1000
            } seconds (Reddit provided)`
         )
         this.http = axiosRateLimit(axios.create(), {
            maxRequests,
            perMilliseconds,
         })
      } else {
         // Default rate limit
         console.log(
            `Reddit API: Setting rate limit to ${axiosDefaultRequests} per ${
               axiosDefaultRequestsMS / 1000
            } seconds (Default)`
         )
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
      if (!this.token || Date.now() >= this.tokenExpiresAt) {
         console.warn(`Reddit API: Token expiring. Retrieving new token.`)
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

   async getNewComments(subreddit, limit = 25) {
      const data = await this.apiRequest(
         `/r/${subreddit}/comments.json`,
         'get',
         { sort: 'new', limit }
      )
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

   async getCommentsForPost(postId, limit = 100) {
      const data = await this.apiRequest(`/comments/${postId}.json`, 'get', {
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
}

module.exports = Reddit
