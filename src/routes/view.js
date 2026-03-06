import { getPaste } from '../services/paste-service.js'

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function buildViewPage(paste) {
  const langMap = { json: 'json', markdown: 'markdown', text: 'plaintext' }
  const lang = langMap[paste.content_type] || 'plaintext'
  const escaped = escapeHtml(paste.content)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>rawtxt / ${paste.id}</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0a0a0a; color: #e0e0e0; font-family: 'JetBrains Mono', monospace; }
    .header {
      padding: 16px 24px;
      border-bottom: 1px solid #222;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header a { color: #00ff88; text-decoration: none; font-weight: bold; }
    .meta { color: #666; font-size: 13px; }
    .meta span { margin-left: 16px; }
    .actions { display: flex; gap: 8px; }
    .actions a, .actions button {
      background: #1a1a1a;
      color: #e0e0e0;
      border: 1px solid #333;
      padding: 6px 12px;
      font-size: 13px;
      font-family: inherit;
      cursor: pointer;
      text-decoration: none;
    }
    .actions a:hover, .actions button:hover { border-color: #00ff88; color: #00ff88; }
    pre { padding: 24px; overflow-x: auto; }
    code { font-family: 'JetBrains Mono', monospace; font-size: 14px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <a href="/">rawtxt</a>
      <span class="meta">
        <span>${paste.content_type}</span>
        <span>${paste.size_bytes} bytes</span>
        <span>~${paste.token_count} tokens</span>
        <span>expires ${paste.expires_at}</span>
      </span>
    </div>
    <div class="actions">
      <a href="/${paste.id}/raw">raw</a>
      <button onclick="navigator.clipboard.writeText(location.origin+'/${paste.id}/raw')">copy raw url</button>
    </div>
  </div>
  <pre><code class="language-${lang}">${escaped}</code></pre>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
  <script>hljs.highlightAll();</script>
</body>
</html>`
}

export default async function viewRoutes(fastify) {
  fastify.get('/:id/raw', async (request, reply) => {
    const paste = getPaste(request.params.id)

    if (!paste) {
      return reply.status(404).send('Not found or expired')
    }

    return reply
      .header('Content-Type', 'text/plain; charset=utf-8')
      .header('X-Content-Type', paste.content_type)
      .header('X-Token-Count', String(paste.token_count))
      .header('X-Expires-At', paste.expires_at)
      .header('Cache-Control', 'no-cache')
      .send(paste.content)
  })

  fastify.get('/:id', async (request, reply) => {
    const paste = getPaste(request.params.id)

    if (!paste) {
      return reply.status(404).header('Content-Type', 'text/plain').send('Not found or expired')
    }

    return reply.header('Content-Type', 'text/html; charset=utf-8').send(buildViewPage(paste))
  })
}
