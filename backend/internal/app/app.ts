import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { bodyLimit } from 'hono/body-limit'
import { attempt, success, unexpectedFailure, type ServiceResult } from '../result/result'
import { apiError } from '../http/error'
import type { AppEnv } from '../http/types'
import type { AppConfig } from '../config/config'
import { connectDb, type Connection } from '../database/client'
import { newRepository as authRepository } from '../auth/repository'
import { newRepository as websiteRepository } from '../website/repository'
import { newRepository as tagRepository } from '../tag/repository'
import { CredentialsService } from '../auth/service'
import { sessionMiddleware } from '../auth/middleware'
import { authRoutes } from '../auth/handler'
import { WebsitesService } from '../website/service'
import { websiteRoutes } from '../website/handler'
import { TagsService } from '../tag/service'
import { tagRoutes } from '../tag/handler'
import { healthRoutes } from '../health/handler'

export interface Application {
  app: Hono<AppEnv>
  close(): Promise<ServiceResult<void>>
}
interface AppOptions {
  database?: Connection
}

export async function createApp(
  config: AppConfig,
  options: AppOptions = {},
): Promise<ServiceResult<Application>> {
  const connected = options.database ? success(options.database) : await connectDb(config)
  if (connected.code !== 0) return connected
  const connection = connected.data
  const db = connection.db
  const close = async (): Promise<ServiceResult<void>> => {
    if (options.database) return success(undefined)
    const closed = await attempt(() => connection.close())
    if (closed.code !== 0) return unexpectedFailure(closed.error)
    return success(undefined)
  }
  const created = await attempt(() => {
    const app = new Hono<AppEnv>()
    const origins = [config.appOrigin, ...(config.appOrigins ?? [])]
    app.use(
      '*',
      cors({
        origin: (origin) => (origins.includes(origin) ? origin : null),
        credentials: true,
        allowMethods: ['GET', 'HEAD', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'X-CSRF-Token'],
      }),
    )
    app.use(
      '*',
      bodyLimit({
        maxSize: 1024 * 1024,
        onError: (c) => c.json(apiError('HTTP_ERROR', 'Request body too large'), 413),
      }),
    )
    app.onError((error, c) => {
      console.error(error)
      return c.json(apiError('INTERNAL_ERROR', 'Internal server error'), 500)
    })
    app.notFound((c) => c.json(apiError('NOT_FOUND', 'Not found'), 404))
    const credentials = new CredentialsService(authRepository(db), config)
    const guard = sessionMiddleware(config, credentials)
    app.route('/', healthRoutes(db))
    app.route('/api/auth', authRoutes(config, credentials, guard))
    app.route('/api/websites', websiteRoutes(new WebsitesService(websiteRepository(db)), guard))
    app.route('/api/tags', tagRoutes(new TagsService(tagRepository(db)), guard))
    return { app, close }
  })
  if (created.code !== 0) {
    const closed = await close()
    if (closed.code !== 0) console.error(closed.error.cause ?? closed.error.message)
    return unexpectedFailure(created.error)
  }
  return success(created.data)
}
