import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import config from './config.js'

let db

export function getDb() {
  if (db) return db

  mkdirSync(dirname(config.dbPath), { recursive: true })

  db = new Database(config.dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('busy_timeout = 5000')
  db.pragma('synchronous = NORMAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS pastes (
      id           TEXT PRIMARY KEY,
      content      TEXT NOT NULL,
      content_type TEXT NOT NULL DEFAULT 'text',
      size_bytes   INTEGER NOT NULL,
      token_count  INTEGER NOT NULL,
      created_at   TEXT NOT NULL DEFAULT (datetime('now')),
      expires_at   TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_pastes_expires_at ON pastes(expires_at);
  `)

  return db
}

export function closeDb() {
  if (db) {
    db.close()
    db = undefined
  }
}
