export function createLoginLimiter() {
  const attempts = new Map<string, { count: number; until: number }>()
  const windowMs = 15 * 60_000
  return {
    isBlocked(key: string, now = Date.now()) {
      const attempt = attempts.get(key)
      if (attempt && attempt.until <= now) attempts.delete(key)
      return !!attempt && attempt.until > now && attempt.count >= 5
    },
    recordFailure(key: string, now = Date.now()) {
      const attempt = attempts.get(key)
      const count = attempt && attempt.until > now ? attempt.count + 1 : 1
      attempts.set(key, { count, until: now + windowMs })
    },
    reset(key: string) {
      attempts.delete(key)
    },
  }
}
