/** Create an in-memory login limiter with a five-failure threshold and a fifteen-minute window. */
export function createLoginLimiter() {
  const attempts = new Map<string, { count: number; until: number }>()
  const windowMs = 15 * 60_000

  return {
    /**
     * Check whether a key has reached the failure threshold and remove an expired
     * attempt entry.
     */
    isBlocked(key: string, now = Date.now()) {
      const attempt = attempts.get(key)

      if (attempt && attempt.until <= now) {
        attempts.delete(key)
      }

      return !!attempt && attempt.until > now && attempt.count >= 5
    },
    /**
     * Record a failed login and extend its window, starting a new count when the
     * previous window expired.
     */
    recordFailure(key: string, now = Date.now()) {
      const attempt = attempts.get(key)
      const count = attempt && attempt.until > now ? attempt.count + 1 : 1
      attempts.set(key, { count, until: now + windowMs })
    },
    /** Clear failed attempts for a key after a successful login. */
    reset(key: string) {
      attempts.delete(key)
    },
  }
}
