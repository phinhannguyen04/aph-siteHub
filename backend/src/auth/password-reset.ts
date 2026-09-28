import { randomBytes } from 'node:crypto'
import type { Surreal } from 'surrealdb'
import { createOrm } from '../database/database.module'

export async function resetAdminPassword(db: Surreal): Promise<string> {
  const password = randomBytes(24).toString('base64url')
  const password_hash = await Bun.password.hash(password, { algorithm: 'argon2id' })
  const version = crypto.randomUUID()
  await createOrm(db).upsert('admin_credentials', 'primary').content({ password_hash, version })
  return password
}
