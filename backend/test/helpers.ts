import { httpData as unwrap } from '../src/common/errors/result'
import pg from 'pg'
import { connectDb } from '../src/database/client'
import { migrateDatabase } from '../src/database/migrate'

/** Each fixture owns a uniquely named disposable PostgreSQL database. */
export async function testDatabase(url: string, migrate = true) {
  const name = `test_${crypto.randomUUID().replaceAll('-', '')}`
  const admin = new pg.Client({ connectionString: url })
  await admin.connect()
  await admin.query(`CREATE DATABASE "${name}"`)
  const target = new URL(url)
  target.pathname = '/' + name
  const connected = await connectDb({ databaseUrl: target.href })
  if (connected.code !== 0) {
    await admin.query(`DROP DATABASE "${name}"`)
    await admin.end()
    return unwrap<never>(connected)
  }
  const connection = connected.data
  if (migrate) {
    const migrated = await migrateDatabase(connection.db)
    if (migrated.code !== 0) {
      unwrap(await connection.close())
      await admin.query(`DROP DATABASE "${name}"`)
      await admin.end()
      return unwrap<never>(migrated)
    }
  }
  return {
    connection,
    async close() {
      unwrap(await connection.close())
      await admin.query(`DROP DATABASE "${name}"`)
      await admin.end()
    },
  }
}
