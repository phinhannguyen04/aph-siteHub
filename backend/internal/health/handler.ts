import { Hono } from 'hono'
import { sql } from 'drizzle-orm'
import type { Database } from '../database/client'
import { apiError } from '../http/error'
import { attempt } from '../result/result'
import type { AppEnv } from '../http/types'

export function healthRoutes(db: Database) {
  const app = new Hono<AppEnv>()
  app.get('/health', async (c) => {
    const result = await attempt(() => db.execute(sql`SELECT 1`))
    if (result.code !== 0)
      return c.json(apiError('DATABASE_UNAVAILABLE', 'Unable to connect to the database'), 503)
    return c.json({ status: 'ok' })
  })
  return app
}
