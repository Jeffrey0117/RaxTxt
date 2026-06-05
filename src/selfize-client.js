/**
 * Selfize client (ESM) — the reusable data layer for parasite apps (寄生獸線路).
 *
 * Stores data in the user's own Selfize REST DB instead of a local SQLite file,
 * so the app builds (no native better-sqlite3) and runs stateless on Render.
 *
 * Config via env (set on the parasite host):
 *   SELFIZE_URL    e.g. https://selfize.isnowfriend.com
 *   SELFIZE_TOKEN  the admin bearer token
 *
 * Uses global fetch (Node >= 18). All methods are async.
 */

export function makeSelfize(opts = {}) {
  const base = (opts.url || process.env.SELFIZE_URL || '').replace(/\/+$/, '')
  const token = opts.token || process.env.SELFIZE_TOKEN || ''
  if (!base) throw new Error('selfize: SELFIZE_URL not set')

  async function call(method, path, body) {
    const res = await fetch(base + path, {
      method,
      headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    const text = await res.text()
    let data = null
    try { data = text ? JSON.parse(text) : null } catch { /* non-json */ }
    return { status: res.status, ok: res.ok, data }
  }

  return {
    raw: call,

    /** Idempotent: create the collection if it doesn't exist. */
    async ensureCollection(name, schema = [], rules) {
      const got = await call('GET', `/api/collections/${name}`)
      if (got.status === 200) return got.data
      const body = { name, schema }
      if (rules) body.rules = rules
      const created = await call('POST', '/api/collections', body)
      if (!created.ok) {
        // NON-FATAL: Selfize collection-mgmt can 401 even for admin; /records auto-create.
        console.warn(`selfize: ensureCollection ${name} skipped (${created.status})`)
        return null
      }
      return created.data
    },

    /** List records. query = raw query string e.g. "pid=eq.abc&limit=1". Returns { items, total }. */
    async list(col, query = '') {
      const r = await call('GET', `/api/collections/${col}/records${query ? '?' + query : ''}`)
      return r.data || { items: [], total: 0 }
    },

    /** Get one record by Selfize id (or null if 404). */
    async get(col, id) {
      const r = await call('GET', `/api/collections/${col}/records/${id}`)
      return r.status === 200 ? r.data : null
    },

    /** Create a record. Returns the created record (with its UUID id). */
    async create(col, fields) {
      const r = await call('POST', `/api/collections/${col}/records`, fields)
      if (!r.ok) throw new Error(`selfize: create record in ${col} failed (${r.status}): ${JSON.stringify(r.data)}`)
      return r.data
    },

    /** Patch a record by id. Returns the updated record. */
    async update(col, id, patch) {
      const r = await call('PATCH', `/api/collections/${col}/records/${id}`, patch)
      if (!r.ok) throw new Error(`selfize: update record ${id} in ${col} failed (${r.status})`)
      return r.data
    },

    /** Delete a record by id. */
    async remove(col, id) {
      const r = await call('DELETE', `/api/collections/${col}/records/${id}`)
      return r.ok || r.status === 404
    },

    /** Find one record by a field value (exact). Returns the record or null. */
    async findOne(col, field, value) {
      const r = await this.list(col, `${field}=eq.${encodeURIComponent(value)}&limit=1`)
      return (r.items && r.items[0]) || null
    },
  }
}
