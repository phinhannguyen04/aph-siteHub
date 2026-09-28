import { expect, test, mock } from 'bun:test'
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
  await expect(reload()).rejects.toThrow('Database unavailable')
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
