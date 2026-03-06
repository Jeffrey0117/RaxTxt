module.exports = {
  apps: [{
    name: 'rawtxt',
    script: 'server.js',
    cwd: '/opt/apps/rawtxt',
    interpreter: 'node',
    node_args: '--experimental-modules',
    env: {
      NODE_ENV: 'production',
      PORT: 4015,
      HOST: '0.0.0.0',
      BASE_URL: 'https://rawtxt.dev',
      DB_PATH: './data/rawtxt.db'
    },
    instances: 1,
    autorestart: true,
    max_memory_restart: '256M',
    watch: false
  }]
}
