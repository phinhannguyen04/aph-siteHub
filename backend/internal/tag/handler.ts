import { sValidator } from '@hono/standard-validator'
import { Hono, type MiddlewareHandler } from 'hono'
import { resultResponse } from '../http/response'
import type { AppEnv } from '../http/types'
import { prepareJson, validationHook } from '../http/validation'
import { tagSchema } from './schema'
import type { TagsService } from './service'

export function tagRoutes(tags: TagsService, guard: MiddlewareHandler<AppEnv>) {
  const app = new Hono<AppEnv>()
  app.use('*', guard)
  app.get('/', async (c) => resultResponse(c, await tags.list(), (tags) => ({ tags })))
  app.post('/', prepareJson, sValidator('json', tagSchema, validationHook), async (c) => {
    const input = c.req.valid('json')
    return resultResponse(c, await tags.create(input), (tag) => ({ tag }), 201)
  })
  app.patch('/:id', prepareJson, sValidator('json', tagSchema, validationHook), async (c) => {
    const input = c.req.valid('json')
    return resultResponse(c, await tags.update(c.req.param('id'), input), (tag) => ({ tag }))
  })
  app.delete('/:id', async (c) =>
    resultResponse(c, await tags.delete(c.req.param('id')), () => ({ ok: true })),
  )
  return app
}
