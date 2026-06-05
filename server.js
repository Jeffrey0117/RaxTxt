import Fastify from 'fastify'
import fastifyStatic from '@fastify/static'
import fastifyRateLimit from '@fastify/rate-limit'
import fastifyCors from '@fastify/cors'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
import config from './src/config.js'
import { getDb, closeDb } from './src/db.js'
import { startCleanup, stopCleanup } from './src/cleanup.js'
import pasteRoutes from './src/routes/paste.js'
import viewRoutes from './src/routes/view.js'
import healthRoutes from './src/routes/health.js'

const app = Fastify({
  logger: true,
  bodyLimit: config.maxContentSize + 1024,
  // Behind the cloudpipe proxy / Cloudflare, so read request.ip from the
  // forwarded client IP — otherwise EVERY visitor looks like the proxy's single
  // IP and they all share one rate-limit bucket (which throttled page assets to
  // 429 → unstyled pages).
  trustProxy: true
})

await app.register(fastifyCors)
// global:false → the limiter only applies to routes that opt in (the write
// endpoint POST /api/paste sets its own config.rateLimit). Page loads + static
// assets (CSS/JS) are never throttled, so the site can't render unstyled.
await app.register(fastifyRateLimit, {
  global: false,
  max: config.rateLimit.max,
  timeWindow: config.rateLimit.timeWindow
})

app.addContentTypeParser('text/plain', { parseAs: 'string' }, (req, body, done) => {
  done(null, body)
})

await app.register(fastifyStatic, {
  root: resolve(__dirname, 'public'),
  prefix: '/static/'
})

app.get('/', async (request, reply) => {
  return reply.sendFile('index.html')
})

await app.register(healthRoutes)
await app.register(pasteRoutes)
await app.register(viewRoutes)

await getDb()
startCleanup()

const shutdown = async () => {
  stopCleanup()
  closeDb()
  await app.close()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

try {
  await app.listen({ port: config.port, host: config.host })
  console.log(`rawtxt running at ${config.baseUrl}`)
} catch (error) {
  app.log.error(error)
  process.exit(1)
}
