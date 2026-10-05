import { readFile } from 'node:fs/promises'
import { backfillWebsiteSearch } from '../websites/search-backfill'
import { runWithDatabase } from './run-with-database'

const result = await runWithDatabase(async (db) => {
  for (const migration of ['001_websites.surql', '002_admin_credentials.surql', '003_tags.surql']) {
    const sql = await readFile(new URL(`../../migrations/${migration}`, import.meta.url), 'utf8')
    await db.query(sql)
    console.log(`Migration ${migration} completed`)
  }
  await backfillWebsiteSearch(db)
})
if (result.code !== 0) {
  console.error(result.error.cause ?? result.error.message)
  process.exitCode = result.code
}
