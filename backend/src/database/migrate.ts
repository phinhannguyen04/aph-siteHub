import { operation, serviceFailure, success, type ServiceResult } from '../common/errors/result'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'
import type { Database } from './client'

export function migrateDatabase(
  db: Database,
  migrationsSchema?: string,
): Promise<ServiceResult<void>> {
  return operation(async () => {
    const migrationsFolder = [
      fileURLToPath(new URL('../migrations', import.meta.url)),
      fileURLToPath(new URL('../../migrations', import.meta.url)),
    ].find((folder) => existsSync(folder + '/meta/_journal.json'))
    if (!migrationsFolder)
      return serviceFailure('CONFIGURATION_ERROR', 'PostgreSQL migration files are missing', 500)
    await migrate(db, {
      migrationsSchema,
      migrationsFolder,
    })
    return success(undefined)
  })
}
