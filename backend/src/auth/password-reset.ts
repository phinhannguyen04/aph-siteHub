import { randomBytes } from 'node:crypto'
import type { Database } from '../database/client'
import { AdminCredentialEntity } from './entities/admin-credential.entity'
import { query } from '../database/error'
import { operation, success, type ServiceResult } from '../common/errors/result'
export async function resetAdminPassword(db: Database): Promise<ServiceResult<string>> {
  return operation(async () => {
    const password = randomBytes(24).toString('base64url')
    const password_hash = await Bun.password.hash(password, { algorithm: 'argon2id' })
    const result = await query(() =>
      db
        .getRepository(AdminCredentialEntity)
        .upsert({ id: 'primary', password_hash, version: crypto.randomUUID() }, ['id']),
    )
    if (result.code !== 0) return result
    return success(password)
  })
}
