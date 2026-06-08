const path = require('path');

module.exports = {
  apps: [
    {
      name: 'ics-backend',
      script: 'dist/src/main.js',
      cwd: path.join(__dirname, 'backend'),
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },
    {
      name: 'ics-frontend',
      script: 'server.js',
      cwd: path.join(__dirname, 'frontend'),
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 9191,
        HOSTNAME: '0.0.0.0',
      },
    },
  ],
};
