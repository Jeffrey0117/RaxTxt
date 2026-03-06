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
  const isMarkdown = paste.content_type === 'markdown'
  const escaped = escapeHtml(paste.content)
  const viewUrl = `${config.baseUrl}/${paste.id}`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>rawtxt / ${paste.id}</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
  ${isMarkdown ? '<script src="https://cdnjs.cloudflare.com/ajax/libs/marked/12.0.1/marked.min.js"></script>' : ''}
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #f5f5f0; color: #222; font-family: 'JetBrains Mono', monospace; }
    .header {
      padding: 16px 24px;
      border-bottom: 2px solid #eee;
      background: #fff;
    }
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header a { color: #000; text-decoration: none; font-weight: 900; font-size: 18px; }
    .meta { color: #999; font-size: 12px; margin-top: 6px; display: flex; flex-wrap: wrap; gap: 4px 14px; }
    .actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
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
      white-space: nowrap;
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
    .qr-popup canvas, .qr-popup img { display: block; border-radius: 4px; }
    .qr-popup p { font-size: 11px; color: #999; margin-top: 8px; }
    pre { padding: 24px; overflow-x: auto; background: #fff; }
    code { font-family: 'JetBrains Mono', monospace; font-size: 14px; }
    .markdown-body {
      padding: 24px 40px;
      background: #fff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      font-size: 15px;
      line-height: 1.7;
      color: #222;
    }
    .markdown-body h1 { font-size: 28px; margin: 20px 0 12px; border-bottom: 1px solid #eee; padding-bottom: 8px; }
    .markdown-body h2 { font-size: 22px; margin: 18px 0 10px; border-bottom: 1px solid #eee; padding-bottom: 6px; }
    .markdown-body h3 { font-size: 18px; margin: 16px 0 8px; }
    .markdown-body p { margin: 0 0 12px; }
    .markdown-body ul, .markdown-body ol { margin: 0 0 12px; padding-left: 24px; }
    .markdown-body li { margin: 4px 0; }
    .markdown-body code { background: #f0f0ec; padding: 2px 6px; border-radius: 4px; font-family: 'JetBrains Mono', monospace; font-size: 13px; }
    .markdown-body pre { background: #f8f8f5; border: 1px solid #eee; border-radius: 8px; padding: 16px; overflow-x: auto; margin: 0 0 12px; }
    .markdown-body pre code { background: none; padding: 0; }
    .markdown-body blockquote { border-left: 4px solid #ddd; padding: 4px 16px; margin: 0 0 12px; color: #666; }
    .markdown-body table { border-collapse: collapse; margin: 0 0 12px; width: 100%; }
    .markdown-body th, .markdown-body td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
    .markdown-body th { background: #f5f5f0; font-weight: 700; }
    .markdown-body a { color: #0066cc; }
    .markdown-body img { max-width: 100%; border-radius: 8px; }
    @media (max-width: 600px) {
      .header { padding: 12px 14px; }
      .header-top { flex-direction: column; align-items: flex-start; gap: 10px; }
      .meta { font-size: 11px; }
      .actions { width: 100%; }
      .copy-all { flex: 1; text-align: center; padding: 10px 14px; font-size: 15px; }
      pre { padding: 14px; }
      code { font-size: 12px; word-break: break-all; }
      .markdown-body { padding: 16px; font-size: 14px; }
      .qr-popup { right: auto; left: 0; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-top">
      <a href="/">rawtxt</a>
      <div class="actions">
        <a href="/${paste.id}/raw">raw</a>
        <button onclick="copyRawUrl()">copy url</button>
        <div class="qr-btn">
          <button onclick="toggleQr()">qr</button>
          <div class="qr-popup" id="qrPopup">
            <div id="qrCanvas"></div>
            <p>scan to open on mobile</p>
          </div>
        </div>
        <button class="copy-all" onclick="copyAll()">copy all</button>
      </div>
    </div>
    <div class="meta">
      <span>${paste.content_type}</span>
      <span>${paste.size_bytes} bytes</span>
      <span>~${paste.token_count} tokens</span>
      <span>${paste.expires_at ? 'expires ' + paste.expires_at : 'forever'}</span>
    </div>
  </div>
  ${isMarkdown
    ? `<div class="markdown-body" id="content"></div>`
    : `<pre><code class="language-${lang}" id="content">${escaped}</code></pre>`}
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
  <script>
    ${isMarkdown
      ? `marked.setOptions({ highlight: (code, lang) => { try { return hljs.highlight(code, {language: lang}).value } catch(e) { return code } } }); document.getElementById('content').innerHTML = marked.parse(${JSON.stringify(paste.content)});`
      : 'hljs.highlightAll();'}
    new QRCode(document.getElementById('qrCanvas'), { text: ${JSON.stringify(viewUrl)}, width: 160, height: 160 });
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
