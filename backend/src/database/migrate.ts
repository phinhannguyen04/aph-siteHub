import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'
import type { Database } from './client'

export function migrateDatabase(db: Database, migrationsSchema?: string) {
  const migrationsFolder = [
    fileURLToPath(new URL('../migrations', import.meta.url)),
    fileURLToPath(new URL('../../migrations', import.meta.url)),
  ].find((folder) => existsSync(folder + '/meta/_journal.json'))
  if (!migrationsFolder) throw new Error('PostgreSQL migration files are missing')
  return migrate(db, {
    migrationsSchema,
    migrationsFolder,
  })
}
