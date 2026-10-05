import postgres from 'postgres'
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { sql } from 'drizzle-orm'
import * as schema from './schema'
import { attempt, success, unexpectedFailure, type ServiceResult } from '../result/result'

export type Database = PostgresJsDatabase<typeof schema>
export type Executor = Pick<Database, 'select' | 'insert' | 'update' | 'delete'>
export interface Connection {
  db: Database
  close(): Promise<void>
}

export async function connectDb(config: {
  databaseUrl: string
}): Promise<ServiceResult<Connection>> {
  const opened = await attempt(() =>
    postgres(config.databaseUrl, {
      max: 10,
      connect_timeout: 10,
      onnotice: () => {},
    }),
  )
  if (opened.code !== 0) return unexpectedFailure(opened.error)
  const client = opened.data
  const db = drizzle(client, { schema })
  const connected = await attempt(() => db.execute(sql`SELECT 1`))
  if (connected.code !== 0) {
    const closed = await attempt(() => client.end({ timeout: 5 }))
    if (closed.code !== 0) console.error(closed.error)
    return unexpectedFailure(connected.error)
  }
  return success({ db, close: () => client.end({ timeout: 5 }) })
}
