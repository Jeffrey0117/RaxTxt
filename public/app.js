const $ = (sel) => document.querySelector(sel)

const contentEl = $('#content')
const expiresEl = $('#expiresIn')
const submitBtn = $('#submit')
const resultEl = $('#result')
const rawUrlEl = $('#rawUrl')
const viewUrlEl = $('#viewUrl')
const copyRawBtn = $('#copyRaw')
const copyViewBtn = $('#copyView')
const tokenCountEl = $('#tokenCount')
const resultMetaEl = $('#resultMeta')

function estimateTokens(text) {
  if (!text) return 0
  const cjk = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g) || []).length
  const remaining = text.length - cjk
  return cjk + Math.ceil(remaining / 4)
}

function updateTokenCount() {
  const count = estimateTokens(contentEl.value)
  tokenCountEl.textContent = `${count.toLocaleString()} tokens`
}

async function submitPaste() {
  const content = contentEl.value.trim()
  if (!content) return

  submitBtn.disabled = true
  submitBtn.textContent = 'submitting...'

  try {
    const res = await fetch('/api/paste', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, expiresIn: expiresEl.value })
    })
    const json = await res.json()

    if (!json.success) {
      throw new Error(json.error)
    }

    rawUrlEl.value = json.data.rawUrl
    viewUrlEl.value = json.data.url
    resultMetaEl.textContent =
      `${json.data.contentType} | ${json.data.sizeBytes} bytes | ~${json.data.tokenCount} tokens | expires ${json.data.expiresAt}`
    resultEl.classList.remove('hidden')

    await navigator.clipboard.writeText(json.data.rawUrl)
    flashCopyBtn(copyRawBtn)
  } catch (error) {
    alert(`Error: ${error.message}`)
  } finally {
    submitBtn.disabled = false
    submitBtn.innerHTML = 'submit <kbd>ctrl+enter</kbd>'
  }
}

function flashCopyBtn(btn) {
  const original = btn.textContent
  btn.textContent = 'copied!'
  btn.style.color = '#00ff88'
  btn.style.borderColor = '#00ff88'
  setTimeout(() => {
    btn.textContent = original
    btn.style.color = ''
    btn.style.borderColor = ''
  }, 1500)
}

async function copyToClipboard(inputEl, btn) {
  await navigator.clipboard.writeText(inputEl.value)
  flashCopyBtn(btn)
}

contentEl.addEventListener('input', updateTokenCount)
submitBtn.addEventListener('click', submitPaste)
copyRawBtn.addEventListener('click', () => copyToClipboard(rawUrlEl, copyRawBtn))
copyViewBtn.addEventListener('click', () => copyToClipboard(viewUrlEl, copyViewBtn))

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault()
    submitPaste()
  }
})

contentEl.focus()
