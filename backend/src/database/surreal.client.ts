import { Surreal } from 'surrealdb'
import type { AppConfig } from '../config/app-config'
import {
  attempt,
  serviceFailure,
  success,
  unexpectedFailure,
  type ServiceResult,
} from '../common/errors/result'

export async function connectDb(
  config: Pick<
    AppConfig,
    'surrealUrl' | 'surrealUser' | 'surrealPass' | 'surrealNamespace' | 'surrealDatabase'
  >,
): Promise<ServiceResult<Surreal>> {
  for (const identifier of [config.surrealNamespace, config.surrealDatabase]) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(identifier))
      return serviceFailure(
        'CONFIGURATION_ERROR',
        'SurrealDB namespace and database must be simple identifiers',
        500,
      )
  }
  const db = new Surreal()
  const connected = await attempt(async () => {
    await db.connect(config.surrealUrl, {
      authentication: { username: config.surrealUser, password: config.surrealPass },
    })
    await db.query(`DEFINE NAMESPACE IF NOT EXISTS ${config.surrealNamespace}`)
    await db.use({ namespace: config.surrealNamespace })
    await db.query(`DEFINE DATABASE IF NOT EXISTS ${config.surrealDatabase}`)
    await db.use({ namespace: config.surrealNamespace, database: config.surrealDatabase })
  })
  if (connected.code !== 0) {
    const closed = await attempt(() => db.close())
    if (closed.code !== 0) console.error(closed.error)
    return unexpectedFailure(connected.error)
  }
  return success(db)
}
