module.exports = {
  apps: [
    {
      name: "jake",
      script: "src/index.js",
      exec_mode: "fork", 
      instances: 1,
      autorestart: true,
      watch: true,
      ignore_watch: [
        "node_modules",
        "logs",
        "debug",
        ".git",
        ".nvm",
        "*.txt"
      ],
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