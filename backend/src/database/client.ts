import 'reflect-metadata'
import { DataSource } from 'typeorm'
import pg from 'pg'
import { AccountEntity } from '../modules/accounts/entities/account.entity'
import { Accounts1791244800000 } from './migrations/accounts-migration'
import { WebsiteEntity } from '../modules/websites/entities/website.entity'
import { TagEntity } from '../modules/tags/entities/tag.entity'
import { WebsiteTagEntity } from '../modules/websites/entities/website-tag.entity'
import { AdminCredentialEntity } from '../modules/auth/entities/admin-credential.entity'
import { InitialSchema1791158400000 } from './migrations/initial-migration'
import {
  attempt,
  operation,
  success,
  unexpectedFailure,
  type ServiceResult,
} from '../common/errors/result'

export type Database = DataSource
export interface Connection {
  db: Database
  close(): Promise<ServiceResult<void>>
}
export async function connectDb(config: {
  databaseUrl: string
}): Promise<ServiceResult<Connection>> {
  const opened = await attempt(
    () =>
      new DataSource({
        type: 'postgres',
        url: config.databaseUrl,
        driver: pg,
        entities: [
          WebsiteEntity,
          TagEntity,
          WebsiteTagEntity,
          AdminCredentialEntity,
          AccountEntity,
        ],
        migrations: [InitialSchema1791158400000, Accounts1791244800000],
        migrationsTableName: 'typeorm_migrations',
        synchronize: false,
        migrationsRun: false,
        extra: { max: 10, connectionTimeoutMillis: 10000 },
      }),
  )
  if (opened.code !== 0) return unexpectedFailure(opened.error)
  const db = opened.data
  const initialized = await attempt(() => db.initialize())
  if (initialized.code !== 0) {
    if (db.isInitialized) await attempt(() => db.destroy())
    return unexpectedFailure(initialized.error)
  }
  return success({
    db,
    close: () =>
      operation(async () => {
        if (db.isInitialized) await db.destroy()
        return success(undefined)
      }),
  })
}
