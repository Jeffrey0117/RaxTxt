# RaxTxt

Minimal text paste service for AI workflows. Paste text, get a raw URL, feed it to any LLM.

## Tech Stack

- **Runtime**: Node.js 20+, ESM modules
- **Framework**: Fastify 5
- **Database**: SQLite via better-sqlite3 (WAL mode)
- **Frontend**: Vanilla HTML/CSS/JS (zero framework)
- **Deployment**: PM2 on CloudPipe VPS (port 4015)

## Architecture

```
server.js                          # Entry: Fastify boot + plugins + routes
src/
  config.js                        # Env vars + defaults (port, baseUrl, limits)
  db.js                            # SQLite init, schema, migration
  cleanup.js                       # setInterval hourly expired paste cleanup
  routes/
    paste.js                       # POST /api/paste (JSON + text/plain)
    view.js                        # GET /:id (HTML preview) + GET /:id/raw (plain text)
    health.js                      # GET /api/health
  services/
    paste-service.js               # Core CRUD: create, get, stats, cleanup
    id-generator.js                # nanoid 8-char IDs
    content-detector.js            # Auto-detect json/markdown/text
    token-counter.js               # Approximate token count (CJK-aware)
public/                            # Static files served at /static/
  index.html                       # Home page UI
  style.css                        # Light theme, RWD
  app.js                           # Frontend logic
cli/
  rawtxt.sh                        # CLI tool (pipe stdin -> URL)
```

## Key Design Decisions

- **Static files at `/static/` prefix** — avoids conflict with `/:id` parametric route. Root `/` is handled by explicit route serving `index.html` via `reply.sendFile()`.
- **`expires_at NULL` = forever** — DB column is nullable. Services and cleanup skip NULL entries. API returns `"forever"` string in response.
- **Lazy deletion** — expired pastes are deleted on read (GET). Scheduled cleanup runs hourly as backup.
- **Content detection** — JSON checked by parse attempt, markdown by pattern count (>=2 matches), fallback to text.
- **Token estimation** — CJK chars = 1 token each, other text = ~4 chars/token. Approximate, not exact.
- **DB migration** — `db.js` auto-detects old schema (expires_at NOT NULL) and rebuilds table to allow NULL.

## API

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/paste` | Create paste. Body: `{"content":"...", "expiresIn":"24h"}` or `text/plain` |
| `GET` | `/:id` | HTML preview with syntax highlighting |
| `GET` | `/:id/raw` | Raw text output for AI consumption |
| `GET` | `/api/health` | Server status + paste stats |

Expiration options: `1h`, `6h`, `24h` (default), `7d`, `30d`, `forever`

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Dev server with --watch (port 4015)
npm start            # Production start
```

## Rate Limiting

- 30 requests/minute per IP (in-memory, @fastify/rate-limit)
- Max content size: 1MB

## Use Cases

Primary: AI workflow relay station. Paste text -> get raw URL -> feed to LLM.

- Feed error logs / diffs / specs to AI via URL
- Share context across multiple AI tools (Claude, ChatGPT, Gemini) with one URL
- MCP / agent automation: Agent A outputs -> rawtxt -> Agent B reads
- Prompt version management with `forever` expiration
- Quick code/config sharing without login
- Shell one-liner: `command | rawtxt -e 1h`

## Conventions

- ESM imports (`import/export`)
- Immutable patterns (no mutation)
- Prepared statements for all SQL (injection prevention)
- HTML escaped on all user content (XSS prevention)
- No authentication (personal tool)
