import { expect, test, mock } from 'bun:test'
import { useWebsites } from '../src/websites-state'

const website = {
  id: '1',
  name: 'Site',
  url: 'https://example.com/',
  created_at: 'now',
  updated_at: 'now',
}
function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

test('reload keeps list and count in sync after a backend change', async () => {
  let count = 0
  globalThis.fetch = mock(async (input: RequestInfo | URL) => {
    if (String(input).endsWith('/count')) return response({ count })
    return response({ websites: count ? [website] : [] })
  }) as typeof fetch
  const { state, reload } = useWebsites()
  await reload()
  expect([state.websites.length, state.count]).toEqual([0, 0])
  count = 1
  await reload()
  expect([state.websites.length, state.count]).toEqual([1, 1])
})

test('failed API reload clears stale list and count', async () => {
  globalThis.fetch = mock(async (input: RequestInfo | URL) =>
    String(input).endsWith('/count') ? response({ count: 1 }) : response({ websites: [website] }),
  ) as typeof fetch
  const { state, reload } = useWebsites()
  await reload()
  globalThis.fetch = mock(async (input: RequestInfo | URL) =>
    String(input).endsWith('/count')
      ? response({ error: { message: 'Database unavailable' } }, 503)
      : response({ websites: [website] }),
  ) as typeof fetch
  await expect(reload()).rejects.toThrow('Database unavailable')
  expect([state.websites.length, state.count]).toEqual([0, 0])
  expect(state.error).toBe('Database unavailable')
})
