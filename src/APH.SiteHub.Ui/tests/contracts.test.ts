import { afterEach, describe, expect, test } from 'bun:test'
import { accountPatch } from '../src/lib/api/accounts'
import { onUnauthorized, request, setToken } from '../src/lib/api/client'
import type { Account, Website } from '../src/lib/api/types'
import { websiteFilters, websitePatch, websiteSearch } from '../src/lib/api/websites'
import { account, changePassword, login, password, tag, website } from '../src/lib/validation'

const originalFetch = globalThis.fetch
const original = {
  id: 'a',
  name: 'Docs',
  url: 'https://example.com/',
  tag_ids: ['a', 'b'],
} as Website
afterEach(() => {
  globalThis.fetch = originalFetch
  setToken('')
  onUnauthorized(() => {})
})
describe('strict contracts', () => {
  test('website PATCH omits unchanged fields and preserves ordered tag edits', () => {
    expect(
      websitePatch(original, { name: 'Docs', url: 'https://example.com/', tag_ids: ['a', 'b'] }),
    ).toEqual({})
    expect(
      websitePatch(original, { name: 'Docs', url: 'https://example.com/', tag_ids: ['b', 'a'] }),
    ).toEqual({ tag_ids: ['b', 'a'] })
  })
  test('account PATCH only includes explicit credentials and changed limit', () => {
    expect(
      accountPatch({ is_limit: true } as Account, { password: '', secret_key: '', is_limit: true }),
    ).toEqual({})
    expect(
      accountPatch({ is_limit: true } as Account, {
        password: 'new value',
        secret_key: '',
        is_limit: false,
      }),
    ).toEqual({ password: 'new value', is_limit: false })
  })
  test('query serialization sanitizes input, emits only supported nonempty keys', () => {
    const filters = websiteFilters(
      new URLSearchParams('page=01&pageSize=99&search=&tagIds=&unknown=x'),
    )
    expect(websiteSearch(filters)).toBe('page=1&pageSize=12')
  })
  test('validation rejects credentials in URLs and invalid password or tags', () => {
    expect(website('Docs', 'https://name:pass@example.com', [])).toHaveProperty('url')
    expect(website('Docs', 'https://example.com', [])).toEqual({})
    expect(password('            ', 12)).toBe(false)
    expect(tag('###', 'desc', '#123456')).toHaveProperty('name')
  })
  test('CSRF rotates and every mutation includes header and same-origin credentials', async () => {
    const seen: RequestInit[] = []
    globalThis.fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
      seen.push(init ?? {})
      return Response.json({ ok: true })
    }) as unknown as typeof fetch
    setToken('first')
    await request('/api/tags', 'POST', { name: 'A', color: '#123456' })
    setToken('second')
    await request('/api/tags/a', 'DELETE')
    expect(seen[0].credentials).toBe('same-origin')
    expect(seen[0].headers).toMatchObject({ 'x-csrf-token': 'first' })
    expect(seen[1].headers).toMatchObject({ 'x-csrf-token': 'second' })
  })
  test('401 invalidates session even if the response is not JSON; network errors are typed', async () => {
    let expired = 0
    onUnauthorized(() => {
      expired++
    })
    setToken('valid')
    globalThis.fetch = (async () => new Response('', { status: 401 })) as unknown as typeof fetch
    expect((await request('/api/accounts')).ok).toBe(false)
    expect(expired).toBe(1)
    globalThis.fetch = (async () => {
      throw new Error('offline')
    }) as unknown as typeof fetch
    expect(await request('/api/accounts')).toMatchObject({
      ok: false,
      error: { code: 'NETWORK_ERROR', status: 0 },
    })
  })
  test('a late response cannot restore data after sign-out', async () => {
    let resolve: (value: Response) => void = () => {}
    globalThis.fetch = (() =>
      new Promise<Response>((done) => {
        resolve = done
      })) as unknown as typeof fetch
    setToken('valid')
    const inFlight = request('/api/accounts')
    setToken('')
    resolve(Response.json({ accounts: [] }))
    expect(await inFlight).toMatchObject({ ok: false, error: { code: 'STALE_REQUEST' } })
  })
})

describe('field errors', () => {
  test('website reports name, URL and tag errors independently', () => {
    expect(Object.keys(website('', '', Array(51).fill('same'))).sort()).toEqual([
      'name',
      'tag_ids',
      'url',
    ])
    expect(website('Valid', 'ftp://example.com', [])).toHaveProperty('url')
    expect(website('x'.repeat(161), 'https://example.com', [])).toHaveProperty('name')
  })
  test('tag fields retain their own constraints', () => {
    expect(Object.keys(tag('###', 'x'.repeat(241), 'red')).sort()).toEqual([
      'color',
      'description',
      'name',
    ])
    expect(tag('# Work', '', '#123abc')).toEqual({})
  })
  test('account create validates every field; edit permits blank unchanged secrets', () => {
    const values = {
      provider: '',
      login_name: '',
      external_account_id: '',
      email: 'bad',
      password: '',
      secret_key: '',
    }
    expect(Object.keys(account(values))).toHaveLength(6)
    expect(account(values, true)).toEqual({})
    expect(
      Object.keys(account({ ...values, password: ' ', secret_key: ' ' }, true)).sort(),
    ).toEqual(['password', 'secret_key'])
  })
  test('login and change-password attach errors to the correct fields', () => {
    expect(login('')).toHaveProperty('password')
    expect(login('valid')).toEqual({})
    expect(Object.keys(changePassword('', 'short', 'different')).sort()).toEqual([
      'confirmPassword',
      'currentPassword',
      'newPassword',
    ])
    expect(changePassword('same password', 'same password', 'same password')).toHaveProperty(
      'newPassword',
    )
    expect(changePassword('old', 'a valid new password', 'a valid new password')).toEqual({})
  })
})
