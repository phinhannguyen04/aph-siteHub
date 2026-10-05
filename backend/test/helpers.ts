import { attempt } from '../../shared/result'
import { httpData as unwrap } from '../src/common/errors/result'
import postgres from 'postgres'
import { connectDb } from '../src/database/client'
import { migrateDatabase } from '../src/database/migrate'

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
