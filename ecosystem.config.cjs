module.exports = {
  apps: [
    {
      name: 'karya',
      script: 'server.ts',
      interpreter: 'tsx',
      cwd: '/var/www/karya',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        PUPPETEER_SKIP_DOWNLOAD: 'true',
        PUPPETEER_EXECUTABLE_PATH: '/usr/bin/chromium-browser'
      }
    }
  ]
};
