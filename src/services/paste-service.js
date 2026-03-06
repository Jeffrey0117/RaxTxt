import { getDb } from '../db.js'
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

export function createPaste(content, expiresIn = config.defaultExpiresIn) {
  const db = getDb()
  const id = generateId()
  const contentType = detectContentType(content)
  const sizeBytes = Buffer.byteLength(content, 'utf8')
  const tokenCount = estimateTokens(content)
  const expiresAt = computeExpiresAt(expiresIn)

  const stmt = db.prepare(`
    INSERT INTO pastes (id, content, content_type, size_bytes, token_count, expires_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
  stmt.run(id, content, contentType, sizeBytes, tokenCount, expiresAt)

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

export function getPaste(id) {
  const db = getDb()
  const paste = db.prepare('SELECT * FROM pastes WHERE id = ?').get(id)

  if (!paste) return null

  if (paste.expires_at && new Date(paste.expires_at + 'Z') < new Date()) {
    db.prepare('DELETE FROM pastes WHERE id = ?').run(id)
    return null
  }

  return paste
}

export function getStats() {
  const db = getDb()
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
  const row = db.prepare(`
    SELECT
      COUNT(*) as total,
      COALESCE(SUM(size_bytes), 0) as totalBytes
    FROM pastes
    WHERE expires_at IS NULL OR expires_at > ?
  `).get(now)

  return {
    activePastes: row.total,
    totalBytes: row.totalBytes
  }
}

export function listRecent(limit = 20) {
  const db = getDb()
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
  return db.prepare(`
    SELECT id, content_type, size_bytes, token_count, created_at, expires_at
    FROM pastes
    WHERE expires_at IS NULL OR expires_at > ?
    ORDER BY created_at DESC
    LIMIT ?
  `).all(now, limit)
}

export function cleanupExpired() {
  const db = getDb()
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
  const result = db.prepare('DELETE FROM pastes WHERE expires_at <= ?').run(now)
  return result.changes
}
