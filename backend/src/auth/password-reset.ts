import { randomBytes } from 'node:crypto'
import type { Database } from '../database/client'
import { newRepository } from './repository'
import { httpData } from '../common/errors/result'
export async function resetAdminPassword(db: Database): Promise<string> {
  const password = randomBytes(24).toString('base64url')
  const password_hash = await Bun.password.hash(password, { algorithm: 'argon2id' })
  httpData(await newRepository(db).reset({ password_hash, version: crypto.randomUUID() }))
  return password
}
