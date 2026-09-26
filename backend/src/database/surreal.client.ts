import { Surreal } from 'surrealdb'
import type { AppConfig } from '../config/app-config'

export async function connectDb(
  config: Pick<
    AppConfig,
    'surrealUrl' | 'surrealUser' | 'surrealPass' | 'surrealNamespace' | 'surrealDatabase'
  >,
): Promise<Surreal> {
  for (const identifier of [config.surrealNamespace, config.surrealDatabase]) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(identifier)) {
      throw new Error('SurrealDB namespace and database must be simple identifiers')
    }
  }
  const db = new Surreal()
  try {
    await db.connect(config.surrealUrl, {
      authentication: { username: config.surrealUser, password: config.surrealPass },
    })
    await db.query(`DEFINE NAMESPACE IF NOT EXISTS ${config.surrealNamespace}`)
    await db.use({ namespace: config.surrealNamespace })
    await db.query(`DEFINE DATABASE IF NOT EXISTS ${config.surrealDatabase}`)
    await db.use({ namespace: config.surrealNamespace, database: config.surrealDatabase })
    return db
  } catch (error) {
    await db.close()
    throw error
  }
}
