import { createApp } from '../../internal/app/app'
import { readConfig } from '../../internal/config/config'
import {
  attempt,
  success,
  unexpectedFailure,
  type ServiceResult,
} from '../../internal/result/result'

async function bootstrap(): Promise<ServiceResult<void>> {
  const configured = await attempt(() => readConfig())
  if (configured.code !== 0) return unexpectedFailure(configured.error)
  const config = configured.data
  const created = await createApp(config)
  if (created.code !== 0) return created
  const application = created.data
  const listening = await attempt(() =>
    Bun.serve({
      port: config.port,
      hostname: '0.0.0.0',
      fetch: (request, server) => application.app.fetch(request, { server }),
    }),
  )
  if (listening.code !== 0) {
    const closed = await application.close()
    if (closed.code !== 0) console.error(closed.error.cause ?? closed.error.message)
    return unexpectedFailure(listening.error)
  }
  const server = listening.data
  let stopping = false
  async function shutdown() {
    if (stopping) return
    stopping = true
    const stopped = await attempt(() => server.stop())
    const closed = await application.close()
    if (stopped.code !== 0 || closed.code !== 0) {
      console.error(stopped.code !== 0 ? stopped.error : closed.code !== 0 ? closed.error : '')
      process.exitCode = 1
    }
  }
  process.once('SIGTERM', () => {
    void shutdown()
  })
  process.once('SIGINT', () => {
    void shutdown()
  })
  console.log(`Hono API listening on ${server.url}`)
  return success(undefined)
}

const result = await bootstrap()
if (result.code !== 0) {
  console.error(result.error.cause ?? result.error.message)
  process.exitCode = result.code
}
