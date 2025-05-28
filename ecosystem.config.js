module.exports = {
    apps: [{
      name: "whatsapp-gateway",
      script: "index.js",
      watch: true,
      autorestart: true,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
      }
    }]
  }