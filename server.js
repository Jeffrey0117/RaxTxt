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
  bodyLimit: config.maxContentSize + 1024
})

await app.register(fastifyCors)
await app.register(fastifyRateLimit, {
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

getDb()
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
