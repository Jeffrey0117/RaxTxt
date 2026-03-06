# RaxTxt

極簡文字投放服務。貼文字、拿 URL、餵 AI。

省掉存檔、給路徑、開 repo 的麻煩 — 一個 AI workflow 的中繼站。

## 用法

### Web UI

開 `https://rawtxt.dev`，貼文字，按 submit，拿到 raw URL。

### API

```bash
# JSON body
curl -X POST https://rawtxt.dev/api/paste \
  -H "Content-Type: application/json" \
  -d '{"content": "你的文字", "expiresIn": "24h"}'

# 純文字
curl -X POST https://rawtxt.dev/api/paste \
  -H "Content-Type: text/plain" \
  -d "你的文字"
```

回傳：

```json
{
  "success": true,
  "data": {
    "id": "T5Qtz3DV",
    "url": "https://rawtxt.dev/T5Qtz3DV",
    "rawUrl": "https://rawtxt.dev/T5Qtz3DV/raw",
    "contentType": "text",
    "sizeBytes": 123,
    "tokenCount": 31,
    "expiresAt": "2026-03-07 01:30:00"
  }
}
```

### CLI

```bash
echo "hello" | rawtxt
cat spec.md | rawtxt
rawtxt "inline text"
```

### Raw 端點

`GET /:id/raw` 回傳純文字，直接丟給 AI 讀：

```
X-Content-Type: markdown
X-Token-Count: 256
X-Expires-At: 2026-03-07 01:30:00
```

## 過期選項

| 選項 | 說明 |
|------|------|
| `1h` | 1 小時 |
| `6h` | 6 小時 |
| `24h` | 24 小時（預設）|
| `7d` | 7 天 |
| `30d` | 30 天 |

## Tech Stack

- **Fastify 5** — 後端框架
- **SQLite** (better-sqlite3, WAL mode) — 資料庫
- **nanoid** — 8 字元短 ID
- **純 HTML/CSS/JS** — 零框架前端

## 開發

```bash
npm install
npm run dev
# http://localhost:4015
```

## 部署

```bash
pm2 start ecosystem.config.cjs
```

## License

MIT
