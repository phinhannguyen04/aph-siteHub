import { attempt } from '../../../shared/result'
import type { Application } from '../app/app'
import type { ServiceResult } from '../result/result'

export function unwrap<T>(result: ServiceResult<T>): T {
  if (result.code !== 0) throw new Error(`${result.error.code}: ${result.error.message}`)
  return result.data
}

/** Exercise Hono's Fetch API without binding a TCP port. */
export function testClient(application: Application) {
  return async (input: {
    url: string
    method?: string
    headers?: Record<string, string>
    payload?: string
  }) => {
    const response = await application.app.request(input.url, {
      method: input.method,
      headers: input.headers,
      body: input.payload,
    })
    const body = await response.json()
    return {
      statusCode: response.status,
      headers: Object.fromEntries(response.headers),
      json: () => body,
    }
  }
}

import postgres from 'postgres'
import { connectDb } from '../database/client'
import { migrateDatabase } from '../database/migrate'

/** Each integration fixture owns a disposable database and migration journal. */
export async function testDatabase(url: string) {
  const name = `test_${crypto.randomUUID().replaceAll('-', '')}`
  const admin = postgres(url, { max: 1, onnotice: () => {} })
  await admin`CREATE DATABASE ${admin(name)}`
  const target = new URL(url)
  target.pathname = '/' + name
  const connected = await connectDb({ databaseUrl: target.href })
  if (connected.code !== 0) {
    await admin`DROP DATABASE ${admin(name)}`
    await admin.end()
    return unwrap<never>(connected)
  }
  const connection = connected.data
  const migrated = await attempt(() => migrateDatabase(connection.db))
  if (migrated.code !== 0) {
    await connection.close()
    await admin`DROP DATABASE ${admin(name)}`
    await admin.end()
    throw new Error('Test migration failed', { cause: migrated.error })
  }
  return {
    connection,
    async close() {
      await connection.close()
      await admin`DROP DATABASE ${admin(name)}`
      await admin.end()
    },
  }
}
