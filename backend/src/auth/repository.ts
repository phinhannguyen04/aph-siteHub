import type { Database } from '../database/client'
import { adminCredentials } from '../database/schema'
import { query } from '../database/error'
import type { ServiceResult } from '../common/errors/result'
import type { Credential } from './credentials.service'
export interface Repository {
  find(): Promise<ServiceResult<Credential | null>>
  initialize(credential: Credential): Promise<ServiceResult<Credential>>
  replace(
    credential: Credential,
    expectedVersion: string,
  ): Promise<ServiceResult<Credential | null>>
  reset(credential: Credential): Promise<ServiceResult<void>>
}
export function newRepository(db: Database): Repository {
  const find = () =>
    db
      .getRepository(adminCredentials)
      .findOne({ where: { id: 'primary' }, select: { password_hash: true, version: true } })
  return {
    find: () => query(find),
    initialize: (credential) =>
      query(async () => {
        await db
          .createQueryBuilder()
          .insert()
          .into(adminCredentials)
          .values({ id: 'primary', ...credential })
          .orIgnore()
          .execute()
        return (await find())!
      }),
    replace: (credential, expectedVersion) =>
      query(async () => {
        const result = await db
          .createQueryBuilder()
          .update(adminCredentials)
          .set(credential)
          .where('id = :id AND version = :version', { id: 'primary', version: expectedVersion })
          .returning(['password_hash', 'version'])
          .execute()
        return (result.raw as Credential[])[0] ?? null
      }),
    reset: (credential) =>
      query(async () => {
        await db.getRepository(adminCredentials).upsert({ id: 'primary', ...credential }, ['id'])
      }),
  }
}
