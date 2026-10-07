import { operation, success, type ServiceResult } from '../common/errors/result'
import type { Database } from './client'

/**
 * Apply pending database migrations in a single transaction and return migration
 * failures as service results.
 */
export function migrateDatabase(db: Database): Promise<ServiceResult<void>> {
  return operation(async () => {
    await db.runMigrations({ transaction: 'all' })

    return success(undefined)
  })
}
