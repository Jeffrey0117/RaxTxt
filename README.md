# RaxTxt

Minimal text paste service built for AI workflows. Paste text, get a URL, feed it to any LLM.

No accounts. No files. No repos. Just text in, URL out.

## Quick Start

**Web UI** — visit [rawtxt.isnowfriend.com](https://rawtxt.isnowfriend.com), paste text, hit submit. The raw URL is copied to your clipboard automatically.

**CLI** — pipe anything and get a raw URL back:

```bash
echo "hello world" | rawtxt
cat spec.md | rawtxt -e forever
git diff | rawtxt -e 1h
```

**API** — one POST, one response:

```bash
curl -X POST https://rawtxt.isnowfriend.com/api/paste \
  -H "Content-Type: application/json" \
  -d '{"content": "your text here", "expiresIn": "24h"}'
```

## API Reference

### POST /api/paste

Create a new paste.

**Request** — accepts `application/json` or `text/plain`:

```json
{
  "content": "your text here",
  "expiresIn": "24h"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "T5Qtz3DV",
    "url": "https://rawtxt.isnowfriend.com/T5Qtz3DV",
    "rawUrl": "https://rawtxt.isnowfriend.com/T5Qtz3DV/raw",
    "contentType": "markdown",
    "sizeBytes": 1234,
    "tokenCount": 308,
    "expiresAt": "2026-03-07 01:30:00"
  }
}
```

### GET /:id/raw

Returns raw text content with `text/plain` content type. Designed for LLM consumption.

Custom response headers:

| Header | Description |
|--------|-------------|
| `X-Content-Type` | Detected type: `text`, `json`, or `markdown` |
| `X-Token-Count` | Approximate token count |
| `X-Expires-At` | Expiration timestamp or `forever` |

### GET /:id

HTML preview page with syntax highlighting (highlight.js).

### GET /api/health

Server status and paste statistics.

```json
{
  "status": "ok",
  "uptime": 3600,
  "activePastes": 42,
  "totalBytes": 128000
}
```

## Expiration Options

| Value | Duration |
|-------|----------|
| `1h` | 1 hour |
| `6h` | 6 hours |
| `24h` | 24 hours (default) |
| `7d` | 7 days |
| `30d` | 30 days |
| `forever` | Never expires |

## CLI

### Install

```bash
# Download and make executable
curl -o /usr/local/bin/rawtxt https://raw.githubusercontent.com/Jeffrey0117/RaxTxt/master/cli/rawtxt.sh
chmod +x /usr/local/bin/rawtxt
```

### Usage

```bash
rawtxt [OPTIONS] [TEXT]
```

**Options:**

| Flag | Description |
|------|-------------|
| `-e, --expires <TIME>` | Set expiration: `1h`, `6h`, `24h`, `7d`, `30d`, `forever` |
| `-v, --view` | Output view URL instead of raw URL |
| `-j, --json` | Output full JSON response |
| `-h, --help` | Show help |

**Examples:**

```bash
# Pipe mode
echo "hello world" | rawtxt
cat spec.md | rawtxt -e forever
git diff | rawtxt -e 1h
docker logs app | rawtxt -e 6h

# Argument mode
rawtxt "quick note"
rawtxt "debug data" -e 7d

# Output formats
cat data.json | rawtxt -v         # view URL
cat data.json | rawtxt -j         # full JSON
```

**Environment variables:**

| Variable | Default | Description |
|----------|---------|-------------|
| `RAWTXT_URL` | `https://rawtxt.isnowfriend.com` | Server URL |

## Content Detection

Content type is detected automatically:

- **json** — valid JSON objects or arrays
- **markdown** — headings, lists, code blocks, links, bold text
- **text** — everything else

## Token Counting

Approximate token count is calculated for each paste:

- CJK characters: 1 token each
- Other text: ~4 characters per token

Useful for estimating LLM context usage before feeding content.

## Tech Stack

- **Fastify 5** — HTTP framework
- **SQLite** via better-sqlite3 (WAL mode) — storage
- **nanoid** — 8-character short IDs
- **Vanilla HTML/CSS/JS** — zero-framework frontend

## Self-Hosting

```bash
git clone https://github.com/Jeffrey0117/RaxTxt.git
cd RaxTxt
npm install
npm run dev
# http://localhost:4015
```

Environment variables (see `.env.example`):

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `4015` | Server port |
| `HOST` | `0.0.0.0` | Bind address |
| `BASE_URL` | `https://rawtxt.isnowfriend.com` | Public URL for generated links |
| `DB_PATH` | `./data/rawtxt.db` | SQLite database path |
| `MAX_CONTENT_SIZE` | `1048576` | Max paste size in bytes (1MB) |
| `RATE_LIMIT_MAX` | `30` | Requests per minute |

**Production (PM2):**

```bash
pm2 start ecosystem.config.cjs
```

## License

MIT
