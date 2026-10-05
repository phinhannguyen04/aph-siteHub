import { createApp } from './app.factory'
import { readConfig } from './config/app.config'
import { attempt, success, unexpectedFailure, type ServiceResult } from './common/errors/result'

async function bootstrap(): Promise<ServiceResult<void>> {
  const configured = readConfig()
  if (configured.code !== 0) return configured
  const config = configured.data
  const created = await createApp(config)
  if (created.code !== 0) return created
  const app = created.data
  app.enableShutdownHooks()
  const listening = await attempt(() => app.listen({ port: config.port, host: '0.0.0.0' }))
  if (listening.code !== 0) {
    const closed = await attempt(() => app.close())
    if (closed.code !== 0) console.error(closed.error)
    return unexpectedFailure(listening.error)
  }
  return success(undefined)
}

const result = await bootstrap()
if (result.code !== 0) {
  console.error(result.error.cause ?? result.error.message)
  process.exitCode = result.code
}
