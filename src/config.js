const config = {
  port: parseInt(process.env.PORT || '4015', 10),
  host: process.env.HOST || '0.0.0.0',
  dbPath: process.env.DB_PATH || './data/rawtxt.db',
  baseUrl: process.env.BASE_URL || 'http://localhost:4015',
  maxContentSize: parseInt(process.env.MAX_CONTENT_SIZE || '1048576', 10),
  defaultExpiresIn: process.env.DEFAULT_EXPIRES_IN || '24h',
  cleanupIntervalMs: parseInt(process.env.CLEANUP_INTERVAL_MS || '3600000', 10),
  rateLimit: {
    max: parseInt(process.env.RATE_LIMIT_MAX || '30', 10),
    timeWindow: process.env.RATE_LIMIT_WINDOW || '1 minute'
  }
}

export default config
