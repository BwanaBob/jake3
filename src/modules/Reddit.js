const axios = require('axios');
const qs = require('qs');
const axiosRateLimit = require('axios-rate-limit');
const { redditClientId, redditClientSecret, redditUserAgent, redditUsername, redditPassword } = require('../config');

class Reddit {
  constructor() {
    this.baseURL = 'https://oauth.reddit.com';
    this.tokenURL = 'https://www.reddit.com/api/v1/access_token';
    this.client = axiosRateLimit(axios.create({ baseURL: this.baseURL }), { maxRequests: 60, perMilliseconds: 60000 });
    this.token = null;
    this.tokenExpiresAt = null;
  }

  async getOAuthToken() {
    const auth = Buffer.from(`${redditClientId}:${redditClientSecret}`).toString('base64');
    try {
      const response = await axios.post(
        this.tokenURL,
        qs.stringify({
          grant_type: 'password',
          username: redditUsername,
          password: redditPassword
        }),
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': redditUserAgent
          }
        }
      );
      this.token = response.data.access_token;
      this.tokenExpiresAt = Date.now() + (response.data.expires_in * 1000); // Store the expiry time
      this.client.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
      this.client.defaults.headers.common['User-Agent'] = redditUserAgent; // Ensure User-Agent is set
      console.log('OAuth token obtained:', this.token); // Log the token for debugging
    } catch (error) {
      console.error('Error fetching OAuth token:', error.response ? error.response.data : error.message);
      throw error;
    }
  }

  async ensureValidToken() {
    if (!this.token || Date.now() >= this.tokenExpiresAt) {
      await this.getOAuthToken();
    }
  }

  async apiRequest(endpoint, params = {}) {
    await this.ensureValidToken();
    try {
      const response = await this.client.get(endpoint, { params });
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 401) { // Unauthorized error, token might be expired
        await this.getOAuthToken();
        return this.apiRequest(endpoint, params); // Retry the request
      } else if (error.response && error.response.status === 429) { // Rate limit error
        const retryAfter = error.response.headers['retry-after'];
        console.warn(`Rate limit exceeded. Retrying after ${retryAfter} seconds.`);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000)); // Wait and retry
        return this.apiRequest(endpoint, params); // Retry the request
      } else {
        console.error(`Error fetching data from ${endpoint}:`, error.response ? error.response.data : error.message);
        throw error;
      }
    }
  }

  async getSubredditPosts(subreddit, limit = 25) {
    const data = await this.apiRequest(`/r/${subreddit}/hot.json`, { limit });
    return data.data.children;
  }

  async getSubredditSettings(subreddit) {
    return await this.apiRequest(`/r/${subreddit}/about/edit`);
  }

  async getNewComments(subreddit, limit = 25) {
    const data = await this.apiRequest(`/r/${subreddit}/comments.json`, { limit });
    return data.data.children;
  }
}

module.exports = Reddit;
