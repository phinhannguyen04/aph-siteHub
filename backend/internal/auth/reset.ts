import { randomBytes } from 'node:crypto'
import type { Repository } from './repository'
import { attempt, success, unexpectedFailure, type ServiceResult } from '../result/result'

export async function resetAdminPassword(repository: Repository): Promise<ServiceResult<string>> {
  const password = randomBytes(24).toString('base64url')
  const hashed = await attempt(() => Bun.password.hash(password, { algorithm: 'argon2id' }))
  if (hashed.code !== 0) return unexpectedFailure(hashed.error)
  const reset = await repository.reset({ password_hash: hashed.data, version: crypto.randomUUID() })
  if (reset.code !== 0) return reset
  return success(password)
}
