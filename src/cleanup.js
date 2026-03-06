import { cleanupExpired } from './services/paste-service.js'
import config from './config.js'

let intervalId

export function startCleanup() {
  intervalId = setInterval(() => {
    try {
      const removed = cleanupExpired()
      if (removed > 0) {
        console.log(`[cleanup] Removed ${removed} expired paste(s)`)
      }
    } catch (error) {
      console.error('[cleanup] Error:', error.message)
    }
  }, config.cleanupIntervalMs)

  intervalId.unref()
}

export function stopCleanup() {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = undefined
  }
}
