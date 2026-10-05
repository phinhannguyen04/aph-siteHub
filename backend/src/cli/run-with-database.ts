import type { Database } from '../database/client'
import { readConfig } from '../config/app-config'
import { connectDb } from '../database/client'
import { attempt, success, unexpectedFailure, type ServiceResult } from '../common/errors/result'

/** Always attempt cleanup, preserving the original operation failure. */
export async function runWithDatabase<T>(
  operation: (db: Database) => Promise<T>,
): Promise<ServiceResult<T>> {
  const configured = await attempt(() => readConfig())
  if (configured.code !== 0) return unexpectedFailure(configured.error)
  const connected = await connectDb(configured.data)
  if (connected.code !== 0) return connected
  const result = await attempt(() => operation(connected.data.db))
  const closed = await attempt(() => connected.data.close())
  if (result.code !== 0) {
    if (closed.code !== 0) console.error(closed.error)
    return unexpectedFailure(result.error)
  }
  if (closed.code !== 0) return unexpectedFailure(closed.error)
  return success(result.data)
}
