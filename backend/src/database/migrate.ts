import { operation, success, type ServiceResult } from '../common/errors/result'
import type { Database } from './client'
export function migrateDatabase(db: Database): Promise<ServiceResult<void>> {
  return operation(async () => {
    await db.runMigrations({ transaction: 'all' })
    return success(undefined)
  })
}
