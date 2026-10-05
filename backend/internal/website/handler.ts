import { sValidator } from '@hono/standard-validator'
import { Hono, type MiddlewareHandler } from 'hono'
import { resultResponse } from '../http/response'
import type { AppEnv } from '../http/types'
import { prepareJson, validationHook } from '../http/validation'
import { listQuerySchema } from './query'
import { createWebsiteSchema, updateWebsiteSchema } from './schema'
import type { WebsitesService } from './service'

export function websiteRoutes(websites: WebsitesService, guard: MiddlewareHandler<AppEnv>) {
  const app = new Hono<AppEnv>()
  app.use('*', guard)
  app.get('/', sValidator('query', listQuerySchema, validationHook), async (c) =>
    resultResponse(c, await websites.list(c.req.valid('query'))),
  )
  app.get('/count', async (c) => resultResponse(c, await websites.count(), (count) => ({ count })))
  app.post('/', prepareJson, sValidator('json', createWebsiteSchema, validationHook), async (c) => {
    const input = c.req.valid('json')
    return resultResponse(c, await websites.create(input), (website) => ({ website }), 201)
  })
  app.patch(
    '/:id',
    prepareJson,
    sValidator('json', updateWebsiteSchema, validationHook),
    async (c) => {
      const input = c.req.valid('json')
      return resultResponse(c, await websites.update(c.req.param('id'), input), (website) => ({
        website,
      }))
    },
  )
  return app
}
