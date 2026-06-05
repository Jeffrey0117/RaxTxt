import { getDb, COLLECTION } from '../db.js'
import { generateId } from './id-generator.js'
import { detectContentType } from './content-detector.js'
import { estimateTokens } from './token-counter.js'
import config from '../config.js'

const EXPIRES_MAP = {
  '1h': 1,
  '6h': 6,
  '24h': 24,
  '7d': 168,
  '30d': 720
}

function computeExpiresAt(expiresIn) {
  if (expiresIn === 'forever') return null
  const hours = EXPIRES_MAP[expiresIn] || EXPIRES_MAP[config.defaultExpiresIn]
  const date = new Date(Date.now() + hours * 3600_000)
  return date.toISOString().replace('T', ' ').slice(0, 19)
}

function isExpired(expiresAt, now = new Date()) {
  return !!expiresAt && new Date(expiresAt + 'Z') < now
}

export async function createPaste(content, expiresIn = config.defaultExpiresIn) {
  const sf = await getDb()
  const id = generateId()
  const contentType = detectContentType(content)
  const sizeBytes = Buffer.byteLength(content, 'utf8')
  const tokenCount = estimateTokens(content)
  const expiresAt = computeExpiresAt(expiresIn)

  await sf.create(COLLECTION, {
    pid: id,
    content,
    content_type: contentType,
    size_bytes: sizeBytes,
    token_count: tokenCount,
    expires_at: expiresAt,
  })

  return {
    id,
    url: `${config.baseUrl}/${id}`,
    rawUrl: `${config.baseUrl}/${id}/raw`,
    contentType,
    sizeBytes,
    tokenCount,
    expiresAt: expiresAt || 'forever'
  }
}

export async function getPaste(id) {
  const sf = await getDb()
  const rec = await sf.findOne(COLLECTION, 'pid', id)
  if (!rec) return null

  if (isExpired(rec.expires_at)) {
    await sf.remove(COLLECTION, rec.id)
    return null
  }

  // Callers expect `.id` to be the short paste id (used to build URLs / title).
  return { ...rec, id: rec.pid }
}

export async function getStats() {
  const sf = await getDb()
  const { items } = await sf.list(COLLECTION, 'limit=10000')
  const now = new Date()
  const active = items.filter(p => !isExpired(p.expires_at, now))
  return {
    activePastes: active.length,
    totalBytes: active.reduce((sum, p) => sum + (p.size_bytes || 0), 0)
  }
}

export async function listRecent(limit = 20) {
  const sf = await getDb()
  const { items } = await sf.list(COLLECTION, 'limit=10000')
  const now = new Date()
  return items
    .filter(p => !isExpired(p.expires_at, now))
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
    .slice(0, limit)
    .map(p => ({
      id: p.pid,
      content_type: p.content_type,
      size_bytes: p.size_bytes,
      token_count: p.token_count,
      created_at: p.created_at,
      expires_at: p.expires_at
    }))
}

export async function cleanupExpired() {
  const sf = await getDb()
  const { items } = await sf.list(COLLECTION, 'limit=10000')
  const now = new Date()
  let removed = 0
  for (const p of items) {
    if (isExpired(p.expires_at, now)) {
      await sf.remove(COLLECTION, p.id)
      removed++
    }
  }
  return removed
}
