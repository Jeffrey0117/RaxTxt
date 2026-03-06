export function estimateTokens(text) {
  const cjkChars = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g) || []).length
  const remaining = text.length - cjkChars
  const nonCjkTokens = Math.ceil(remaining / 4)
  return cjkChars + nonCjkTokens
}
