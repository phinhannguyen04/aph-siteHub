import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { fileURLToPath } from 'node:url'
import type { Database } from './client'

export function migrateDatabase(db: Database, migrationsSchema?: string) {
  return migrate(db, {
    migrationsSchema,
    migrationsFolder: fileURLToPath(new URL('../../migrations', import.meta.url)),
  })
}
