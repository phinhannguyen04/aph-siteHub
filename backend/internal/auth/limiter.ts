import type { Context } from 'hono'
import { getConnInfo } from '@hono/bun'
import { MemoryStore, rateLimiter } from 'hono-rate-limiter'
import type { AppEnv } from '../http/types'
import { apiError } from '../http/error'

export function clientAddress(c: Context<AppEnv>): string {
  // The private backend receives X-Real-IP overwritten by the configured Nginx proxy.
  return (
    c.req.header('x-real-ip') ||
    (c.env?.server ? getConnInfo(c).remote.address : undefined) ||
    'unknown'
  )
}

export function newLoginLimiter() {
  const store = new MemoryStore<AppEnv>()
  return {
    middleware: rateLimiter<AppEnv>({
      windowMs: 15 * 60_000,
      limit: 5,
      keyGenerator: clientAddress,
      store,
      skipSuccessfulRequests: true,
      requestWasSuccessful: (c) => c.res.status !== 401,
      handler: (c) => c.json(apiError('RATE_LIMITED', 'Please try again in 15 minutes'), 429),
    }),
    reset: (c: Context<AppEnv>) => store.resetKey(clientAddress(c)),
    close: () => store.shutdown(),
  }
}
export type LoginLimiter = ReturnType<typeof newLoginLimiter>
