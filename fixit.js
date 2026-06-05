const fs = require('fs')
const p = 'src/routes/view.js'
let s = fs.readFileSync(p, 'utf8')
const start = s.indexOf('function safeJson(value) {')
const end = s.indexOf('function buildViewPage(paste) {')
if (start < 0 || end < 0) { console.error('anchors missing'); process.exit(1) }
const clean =
  'function safeJson(value) {\n' +
  '  return JSON.stringify(value)\n' +
  "    .replace(/</g, '\\\\u003c')\n" +
  "    .replace(/>/g, '\\\\u003e')\n" +
  "    .replace(/&/g, '\\\\u0026')\n" +
  '}\n\n'
s = s.slice(0, start) + clean + s.slice(end)
fs.writeFileSync(p, s)
console.log('rewritten safeJson')
