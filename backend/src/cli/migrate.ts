import { migrateDatabase } from '../database/migrate'
import { backfillWebsiteSearch } from '../websites/search-backfill'
import { runWithDatabase } from './run-with-database'
const result = await runWithDatabase(async (db) => {
  await migrateDatabase(db)
  await backfillWebsiteSearch(db)
  console.log('PostgreSQL migrations completed')
})
if (result.code !== 0) {
  console.error(result.error.cause ?? result.error.message)
  process.exitCode = result.code
}
