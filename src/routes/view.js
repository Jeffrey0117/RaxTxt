import { getPaste } from '../services/paste-service.js'
import config from '../config.js'

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
  const viewUrl = `${config.baseUrl}/${paste.id}`
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(viewUrl)}&size=200x200&margin=8`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>rawtxt / ${paste.id}</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #f5f5f0; color: #222; font-family: 'JetBrains Mono', monospace; }
    .header {
      padding: 16px 24px;
      border-bottom: 2px solid #eee;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #fff;
    }
    .header a { color: #000; text-decoration: none; font-weight: 900; font-size: 18px; }
    .meta { color: #999; font-size: 13px; }
    .meta span { margin-left: 16px; }
    .actions { display: flex; gap: 8px; align-items: center; }
    .actions a, .actions button {
      background: #f5f5f0;
      color: #222;
      border: 2px solid #ddd;
      border-radius: 6px;
      padding: 6px 14px;
      font-size: 13px;
      font-family: inherit;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
    }
    .actions a:hover, .actions button:hover { border-color: #000; color: #000; }
    .copy-all {
      background: #000 !important;
      color: #fff !important;
      border: 2px solid #000 !important;
    }
    .copy-all:hover { background: #333 !important; }
    .qr-btn { position: relative; }
    .qr-popup {
      display: none;
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: 8px;
      background: #fff;
      border: 2px solid #000;
      border-radius: 10px;
      padding: 16px;
      z-index: 10;
      text-align: center;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    }
    .qr-popup.show { display: block; }
    .qr-popup img { display: block; border-radius: 4px; }
    .qr-popup p { font-size: 11px; color: #999; margin-top: 8px; }
    pre { padding: 24px; overflow-x: auto; background: #fff; }
    code { font-family: 'JetBrains Mono', monospace; font-size: 14px; }
    @media (max-width: 600px) {
      .header { flex-direction: column; gap: 10px; padding: 12px 14px; align-items: flex-start; }
      .meta { font-size: 11px; }
      .meta span { margin-left: 0; margin-right: 10px; }
      .actions { flex-wrap: wrap; }
      .copy-all { flex: 1; text-align: center; padding: 10px 14px; font-size: 15px; }
      pre { padding: 14px; }
      code { font-size: 12px; }
      .qr-popup { right: auto; left: 0; }
    }
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
        <span>${paste.expires_at ? 'expires ' + paste.expires_at : 'forever'}</span>
      </span>
    </div>
    <div class="actions">
      <a href="/${paste.id}/raw">raw</a>
      <button onclick="copyRawUrl()">copy raw url</button>
      <div class="qr-btn">
        <button onclick="toggleQr()">qr</button>
        <div class="qr-popup" id="qrPopup">
          <img src="${qrUrl}" alt="QR Code" width="200" height="200">
          <p>scan to open on mobile</p>
        </div>
      </div>
      <button class="copy-all" onclick="copyAll()">copy all</button>
    </div>
  </div>
  <pre><code class="language-${lang}" id="content">${escaped}</code></pre>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
  <script>
    hljs.highlightAll();
    const rawContent = ${JSON.stringify(paste.content)};
    function flash(btn, msg) {
      const orig = btn.textContent;
      btn.textContent = msg;
      setTimeout(() => btn.textContent = orig, 1500);
    }
    function copyAll() {
      navigator.clipboard.writeText(rawContent);
      flash(document.querySelector('.copy-all'), 'copied!');
    }
    function copyRawUrl() {
      navigator.clipboard.writeText(location.origin + '/${paste.id}/raw');
      flash(event.target, 'copied!');
    }
    function toggleQr() {
      document.getElementById('qrPopup').classList.toggle('show');
    }
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.qr-btn')) {
        document.getElementById('qrPopup').classList.remove('show');
      }
    });
  </script>
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
      .header('X-Expires-At', paste.expires_at || 'forever')
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
