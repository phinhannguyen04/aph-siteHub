import { attempt, success, unexpectedFailure, type ServiceResult } from '../result/result'
import type { AppConfig } from '../config/config'
import type { Repository } from './repository'

export function verifyAdminPassword(password: string, hash: string) {
  return attempt(() => Bun.password.verify(password, hash)).then(
    (result) => result.code === 0 && result.data,
  )
}
export interface Credential {
  password_hash: string
  version: string
}

export class CredentialsService {
  constructor(
    private readonly repository: Repository,
    private readonly config: Pick<AppConfig, 'adminPasswordHash'>,
  ) {}
  async current(): Promise<ServiceResult<Credential>> {
    const current = await this.repository.find()
    if (current.code !== 0) return current
    if (current.data) return success(current.data)
    if (!this.config.adminPasswordHash)
      return unexpectedFailure(
        new Error('Initial administrator hash is missing; run the password reset command'),
      )
    return this.repository.initialize({
      password_hash: this.config.adminPasswordHash,
      version: crypto.randomUUID(),
    })
  }
  async replace(
    password: string,
    expectedVersion: string,
  ): Promise<ServiceResult<Credential | null>> {
    const hashed = await attempt(() => Bun.password.hash(password, { algorithm: 'argon2id' }))
    if (hashed.code !== 0) return unexpectedFailure(hashed.error)
    return this.repository.replace(
      { password_hash: hashed.data, version: crypto.randomUUID() },
      expectedVersion,
    )
  }
}
