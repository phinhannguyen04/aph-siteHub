import { randomBytes } from 'node:crypto'
import type { Database } from '../database/client'
import { newRepository } from './repository'
import { operation, success, type ServiceResult } from '../common/errors/result'
export async function resetAdminPassword(db: Database): Promise<ServiceResult<string>> {
  return operation(async () => {
    const password = randomBytes(24).toString('base64url')
    const password_hash = await Bun.password.hash(password, { algorithm: 'argon2id' })
    const result = await newRepository(db).reset({ password_hash, version: crypto.randomUUID() })
    if (result.code !== 0) return result
    return success(password)
  })
}
