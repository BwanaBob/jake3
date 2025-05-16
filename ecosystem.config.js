module.exports = {
  apps: [
    {
      name: "jake",
      script: "src/index.js",
      exec_mode: "fork", 
      instances: 1,
      autorestart: true,
      watch: true,
      watch_options: {
        ignore_watch: [
          "posts.txt",
          "queue-items.txt",
          "modlog.txt",
          "comments.txt"
        ]
      },
      max_memory_restart: "300M",
      env: {
        NODE_ENV: "development"
      },
      env_production: {
        NODE_ENV: "production"
      }
    }
  ]
};