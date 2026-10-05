import type { Database } from '../database/client'
import { readConfig } from '../config/app-config'
import { connectDb } from '../database/client'
import { operation as capture, type ServiceResult } from '../common/errors/result'

/** Cleanup runs on success and failure, preserving the original operation error. */
export async function runWithDatabase<T>(
  operation: (db: Database) => Promise<ServiceResult<T>>,
): Promise<ServiceResult<T>> {
  const configured = readConfig()
  if (configured.code !== 0) return configured
  const connected = await connectDb(configured.data)
  if (connected.code !== 0) return connected
  const result = await capture(() => operation(connected.data.db))
  const closed = await connected.data.close()
  if (result.code !== 0) {
    if (closed.code !== 0) console.error(closed.error.cause ?? closed.error.message)
    return result
  }
  if (closed.code !== 0) return closed
  return result
}
