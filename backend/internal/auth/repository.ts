import { and, eq } from 'drizzle-orm'
import type { Database } from '../database/client'
import { adminCredentials } from '../database/schema'
import { query } from '../database/error'
import type { ServiceResult } from '../result/result'
import type { Credential } from './service'

export interface Repository {
  find(): Promise<ServiceResult<Credential | null>>
  initialize(credential: Credential): Promise<ServiceResult<Credential>>
  replace(
    credential: Credential,
    expectedVersion: string,
  ): Promise<ServiceResult<Credential | null>>
  reset(credential: Credential): Promise<ServiceResult<void>>
}
const columns = { password_hash: adminCredentials.password_hash, version: adminCredentials.version }

export function newRepository(db: Database): Repository {
  return {
    find: () =>
      query(
        async () =>
          (
            await db
              .select(columns)
              .from(adminCredentials)
              .where(eq(adminCredentials.id, 'primary'))
          )[0] ?? null,
      ),
    initialize: (credential) =>
      query(async () => {
        await db
          .insert(adminCredentials)
          .values({ id: 'primary', ...credential })
          .onConflictDoNothing({ target: adminCredentials.id })
        const [current] = await db
          .select(columns)
          .from(adminCredentials)
          .where(eq(adminCredentials.id, 'primary'))
        return current!
      }),
    replace: (credential, expectedVersion) =>
      query(async () => {
        const [row] = await db
          .update(adminCredentials)
          .set(credential)
          .where(
            and(eq(adminCredentials.id, 'primary'), eq(adminCredentials.version, expectedVersion)),
          )
          .returning(columns)
        return row ?? null
      }),
    reset: (credential) =>
      query(async () => {
        await db
          .insert(adminCredentials)
          .values({ id: 'primary', ...credential })
          .onConflictDoUpdate({ target: adminCredentials.id, set: credential })
      }),
  }
}
