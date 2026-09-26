import { readConfig } from '../config/app-config'
import { connectDb } from '../database/surreal.client'
import { resetAdminPassword } from '../auth/password-reset'

const db = await connectDb(readConfig())
try {
  const password = await resetAdminPassword(db)
  console.log(`New administrator password (shown once): ${password}`)
} finally {
  await db.close()
}
