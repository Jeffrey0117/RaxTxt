import { createPaste } from '../services/paste-service.js'
import config from '../config.js'

const VALID_EXPIRES = ['1h', '6h', '24h', '7d', '30d', 'forever']

export default async function pasteRoutes(fastify) {
  fastify.post('/api/paste', {
    config: {
      rateLimit: {
        max: config.rateLimit.max,
        timeWindow: config.rateLimit.timeWindow
      }
    }
  }, async (request, reply) => {
    const contentType = request.headers['content-type'] || ''
    let content
    let expiresIn = config.defaultExpiresIn

    if (contentType.includes('text/plain')) {
      content = request.body
    } else {
      const body = request.body || {}
      content = body.content
      if (body.expiresIn) {
        expiresIn = body.expiresIn
      }
    }

    if (!content || typeof content !== 'string') {
      return reply.status(400).send({
        success: false,
        error: 'Content is required and must be a string'
      })
    }

    if (Buffer.byteLength(content, 'utf8') > config.maxContentSize) {
      return reply.status(413).send({
        success: false,
        error: `Content exceeds maximum size of ${config.maxContentSize} bytes`
      })
    }

    if (!VALID_EXPIRES.includes(expiresIn)) {
      return reply.status(400).send({
        success: false,
        error: `Invalid expiresIn. Valid options: ${VALID_EXPIRES.join(', ')}`
      })
    }

    const paste = createPaste(content, expiresIn)
    return reply.status(201).send({
      success: true,
      data: paste
    })
  })
}
