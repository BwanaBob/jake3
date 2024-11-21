const { AtpAgent, RichText } = require('@atproto/api')
const fs = require('fs')

class BlueSky {
   constructor(username, password) {
      this.username = username
      this.password = password
      this.serviceUrl = 'https://bsky.social'
      this.agent = new AtpAgent({
         service: this.serviceUrl,
      })
   }


   async login() {
      try {
         console.log('Logging in with credentials...')
         await this.agent.login({
            identifier: this.username,
            password: this.password,
         })
         console.log('Logged in successfully.')
      } catch (err) {
         console.warn('Failed to login:', err.message)
      }
   }

   async createPostWithImage(text, imagePath) {
      try {
         await this.login()
         const rt = new RichText({ text: text })
         await rt.detectFacets(this.agent) // automatically detects mentions and links

         const imageBuffer = fs.readFileSync(imagePath)
         const uploadedImage = await this.agent.api.com.atproto.repo.uploadBlob(
            imageBuffer,
            {
               encoding: 'image/png', // Adjust MIME type as needed
            }
         )

         // Create the post
         await this.agent.api.app.bsky.feed.post.create(
            { repo: this.agent.session.did }, // Use the DID of the authenticated user
            {
               text: rt.text,
               facets: rt.facets,
               createdAt: new Date().toISOString(),
               embed: {
                  $type: 'app.bsky.embed.images',
                  images: [
                     {
                        image: uploadedImage.data.blob,
                        alt: 'Image description', // Provide a meaningful description
                     },
                  ],
               },
            }
         )

         console.log('Post created successfully!')
      } catch (err) {
         console.error('Failed to create a post:', err)
      }
   }
}

module.exports = BlueSky
