import { success } from '../common/errors/result'
import { migrateDatabase } from '../database/migrate'
import { backfillWebsiteSearch } from '../websites/search-backfill'
import { runWithDatabase } from './run-with-database'
const result = await runWithDatabase(async (db) => {
  const migrated = await migrateDatabase(db)
  if (migrated.code !== 0) return migrated
  const backfilled = await backfillWebsiteSearch(db)
  if (backfilled.code !== 0) return backfilled
  console.log('PostgreSQL migrations completed')
  return success(undefined)
})
if (result.code !== 0) {
  console.error(result.error.cause ?? result.error.message)
  process.exitCode = result.code
}
