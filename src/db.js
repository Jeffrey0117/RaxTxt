/**
 * Data layer — Selfize-backed (寄生獸線路).
 *
 * Was local better-sqlite3; now stores pastes in the user's own Selfize REST DB
 * so rawtxt runs stateless on a free host (Render) with no native module.
 *
 * The short paste id (nanoid) is stored as the `pid` field — Selfize assigns its
 * own UUID `id` + `created_at`/`updated_at` to every record.
 */

import { makeSelfize } from './selfize-client.js'

export const COLLECTION = 'rawtxt_pastes'

const PASTE_SCHEMA = [
  { name: 'pid', type: 'text' },
  { name: 'content', type: 'text' },
  { name: 'content_type', type: 'text' },
  { name: 'size_bytes', type: 'number' },
  { name: 'token_count', type: 'number' },
  { name: 'expires_at', type: 'text' },
]

let sf

/** Lazy singleton: build the Selfize client + ensure the collection exists. */
export async function getDb() {
  if (sf) return sf
  const client = makeSelfize()
  await client.ensureCollection(COLLECTION, PASTE_SCHEMA)
  sf = client
  return sf
}

/** No-op (Selfize is stateless HTTP) — kept so callers don't change. */
export function closeDb() {
  sf = undefined
}
