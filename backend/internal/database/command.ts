import { readConfig } from '../config/config'
import { connectDb, type Database } from './client'
import { attempt, unexpectedFailure, type ServiceResult } from '../result/result'

export async function runWithDatabase<T>(
  operation: (db: Database) => Promise<ServiceResult<T>>,
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
  if (result.data.code !== 0) {
    if (closed.code !== 0) console.error(closed.error)
    return result.data
  }
  if (closed.code !== 0) return unexpectedFailure(closed.error)
  return result.data
}
