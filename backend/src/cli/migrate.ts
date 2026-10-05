import { success } from '../common/errors/result'
import { migrateDatabase } from '../database/migrate'
import { runWithDatabase } from './run-with-database'
const result = await runWithDatabase(async (db) => {
  const migrated = await migrateDatabase(db)
  if (migrated.code !== 0) return migrated
  console.log('PostgreSQL migrations completed')
  return success(undefined)
})
if (result.code !== 0) {
  console.error(result.error.cause ?? result.error.message)
  process.exitCode = result.code
}
