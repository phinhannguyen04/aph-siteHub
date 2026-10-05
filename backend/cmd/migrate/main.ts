import { runWithDatabase } from '../../internal/database/command'
import { migrateDatabase } from '../../internal/database/migrate'
import { operation, success } from '../../internal/result/result'

const result = await runWithDatabase((db) =>
  operation(async () => {
    await migrateDatabase(db)
    console.log('PostgreSQL migrations completed')
    return success(undefined)
  }),
)
if (result.code !== 0) {
  console.error(result.error.cause ?? result.error.message)
  process.exitCode = result.code
}
