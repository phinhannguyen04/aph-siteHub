import { readFile } from 'node:fs/promises'
import { readConfig } from '../config/app-config'
import { connectDb } from '../database/surreal.client'

const db = await connectDb(readConfig())
try {
  for (const migration of ['001_websites.surql', '002_admin_credentials.surql']) {
    const sql = await readFile(new URL(`../../migrations/${migration}`, import.meta.url), 'utf8')
    await db.query(sql)
    console.log(`Migration ${migration} completed`)
  }
} finally {
  await db.close()
}
