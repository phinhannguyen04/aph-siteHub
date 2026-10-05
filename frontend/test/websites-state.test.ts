import { afterEach, expect, test, mock } from 'bun:test'
import { api } from '../src/api'
const originalFetch = globalThis.fetch
afterEach(() => {
  globalThis.fetch = originalFetch
})
import { useWebsites } from '../src/websites-state'
const website = {
  id: '1',
  name: 'Site',
  url: 'https://example.com/',
  tag_ids: [],
  tags: [],
  created_at: 'now',
  updated_at: 'now',
}
function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}
test('reload keeps page and count in sync', async () => {
  let count = 0
  globalThis.fetch = mock(async (input: RequestInfo | URL) =>
    String(input).endsWith('/count')
      ? response({ count })
      : response({ websites: count ? [website] : [], total: count, page: 1, pageSize: 12 }),
  ) as typeof fetch
  const { state, reload } = useWebsites()
  await reload()
  expect([state.websites.length, state.count, state.total]).toEqual([0, 0, 0])
  count = 1
  await reload()
  expect([state.websites.length, state.count, state.total]).toEqual([1, 1, 1])
})
test('failed API reload clears stale list and count', async () => {
  globalThis.fetch = mock(async (input: RequestInfo | URL) =>
    String(input).endsWith('/count')
      ? response({ count: 1 })
      : response({ websites: [website], total: 1, page: 1, pageSize: 12 }),
  ) as typeof fetch
  const { state, reload } = useWebsites()
  await reload()
  globalThis.fetch = mock(async (input: RequestInfo | URL) =>
    String(input).endsWith('/count')
      ? response({ error: { message: 'Database unavailable' } }, 503)
      : response({ websites: [website], total: 1, page: 1, pageSize: 12 }),
  ) as typeof fetch
  const result = await reload()
  expect(result.code).toBe(1)
  if (result.code !== 0) expect(result.error.message).toBe('Database unavailable')
  expect([state.websites.length, state.count, state.total]).toEqual([0, 0, 0])
  expect(state.error).toBe('Database unavailable')
})
test('older responses cannot overwrite newer filter results', async () => {
  let finishOld!: (value: Response) => void
  globalThis.fetch = mock(async (input: RequestInfo | URL) => {
    const path = String(input)
    if (path.endsWith('/count')) return response({ count: 2 })
    if (path.includes('search=old'))
      return new Promise<Response>((resolve) => {
        finishOld = resolve
      })
    return response({ websites: [website], total: 1, page: 1, pageSize: 12 })
  }) as typeof fetch
  const { state, reload } = useWebsites()
  const old = reload({ page: 1, pageSize: 12, search: 'old', tagIds: [] })
  await reload({ page: 1, pageSize: 12, search: 'new', tagIds: [] })
  finishOld(response({ websites: [], total: 0, page: 1, pageSize: 12 }))
  await old
  expect(state.websites).toHaveLength(1)
  expect(state.total).toBe(1)
})

test('network failure returns a code and releases loading state', async () => {
  globalThis.fetch = mock(() => Promise.reject(new TypeError('Failed to fetch'))) as typeof fetch
  const { state, reload } = useWebsites()
  const result = await reload()
  expect(result.code).toBe(1)
  if (result.code !== 0) {
    expect(result.error.code).toBe('NETWORK_ERROR')
    expect(result.error.status).toBe(0)
  }
  expect(state.loading).toBe(false)
  expect(state.error).toBe('Unable to connect to the server')
})

test('API preserves HTTP error codes and handles malformed responses', async () => {
  globalThis.fetch = mock(async () =>
    response({ error: { code: 'UNAUTHORIZED', message: 'Please sign in' } }, 401),
  ) as typeof fetch
  const unauthorized = await api.session()
  expect(unauthorized.code).toBe(1)
  if (unauthorized.code !== 0) {
    expect(unauthorized.error).toEqual({
      code: 'UNAUTHORIZED',
      message: 'Please sign in',
      status: 401,
    })
  }
  globalThis.fetch = mock(async () => new Response('not JSON')) as typeof fetch
  const malformed = await api.session()
  expect(malformed.code).toBe(1)
  if (malformed.code !== 0) expect(malformed.error.code).toBe('INVALID_RESPONSE')
  globalThis.fetch = mock(async () => new Response('not JSON', { status: 502 })) as typeof fetch
  const unavailable = await api.session()
  expect(unavailable.code).toBe(1)
  if (unavailable.code !== 0)
    expect(unavailable.error).toEqual({
      code: 'HTTP_ERROR',
      message: 'HTTP error 502',
      status: 502,
    })
})

test('an older failed response cannot clear newer data or set an error', async () => {
  let finishOld!: (value: Response) => void
  globalThis.fetch = mock(async (input: RequestInfo | URL) => {
    const path = String(input)
    if (path.endsWith('/count')) return response({ count: 1 })
    if (path.includes('search=old'))
      return new Promise<Response>((resolve) => {
        finishOld = resolve
      })
    return response({ websites: [website], total: 1, page: 1, pageSize: 12 })
  }) as typeof fetch
  const { state, reload } = useWebsites()
  const old = reload({ page: 1, pageSize: 12, search: 'old', tagIds: [] })
  await reload({ page: 1, pageSize: 12, search: 'new', tagIds: [] })
  finishOld(response({ error: { code: 'INTERNAL_ERROR', message: 'Old failure' } }, 500))
  await old
  expect(state.websites).toHaveLength(1)
  expect(state.error).toBe('')
  expect(state.loading).toBe(false)
})
