import { getStats } from '../services/paste-service.js'

export default async function healthRoutes(fastify) {
  fastify.get('/api/health', async () => {
    const stats = getStats()
    return {
      status: 'ok',
      uptime: Math.floor(process.uptime()),
      ...stats
    }
  })
}
