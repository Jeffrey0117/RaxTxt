export function detectContentType(content) {
  const trimmed = content.trim()

  if (isJson(trimmed)) return 'json'
  if (isMarkdown(trimmed)) return 'markdown'
  return 'text'
}

function isJson(text) {
  if ((!text.startsWith('{') && !text.startsWith('[')) ||
      (!text.endsWith('}') && !text.endsWith(']'))) {
    return false
  }
  try {
    JSON.parse(text)
    return true
  } catch {
    return false
  }
}

function isMarkdown(text) {
  const mdPatterns = [
    /^#{1,6}\s/m,
    /^\s*[-*+]\s/m,
    /^\s*\d+\.\s/m,
    /```[\s\S]*?```/,
    /\[.+?\]\(.+?\)/,
    /^\s*>\s/m,
    /\*\*.+?\*\*/,
    /^\s*\|.+\|/m
  ]
  const matchCount = mdPatterns.filter(p => p.test(text)).length
  return matchCount >= 2
}
