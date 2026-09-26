import { randomBytes } from 'node:crypto'
import type { Surreal } from 'surrealdb'

export async function resetAdminPassword(db: Surreal): Promise<string> {
  const password = randomBytes(24).toString('base64url')
  const password_hash = await Bun.password.hash(password, { algorithm: 'argon2id' })
  const version = crypto.randomUUID()
  await db.query(
    'UPSERT admin_credentials:primary CONTENT { password_hash: $password_hash, version: $version }',
    { password_hash, version },
  )
  return password
}
