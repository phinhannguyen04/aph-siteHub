import assert from 'node:assert/strict'
import { test } from 'node:test'
import { accountPatch, websiteFilters, websitePatch, websiteSearch } from '../src/lib/api.js'
import * as validate from '../src/lib/validation.js'

const id = '11111111-1111-4111-8111-111111111111'

test('website filters fall back to safe defaults for invalid input', () => {
  const filters = websiteFilters(new URLSearchParams('page=0&pageSize=49&tagIds=nope,' + id))
  assert.deepEqual(filters, { page: 1, pageSize: 12, search: '', tagIds: [id] })
})

test('website filters keep valid values and de-duplicate tags', () => {
  const filters = websiteFilters(
    new URLSearchParams(`page=3&pageSize=24&search=%20docs%20&tagIds=${id},${id}`),
  )
  assert.deepEqual(filters, { page: 3, pageSize: 24, search: 'docs', tagIds: [id] })
  assert.equal(websiteSearch(filters), `page=3&pageSize=24&search=docs&tagIds=${id}`)
})

test('patches only contain changed fields', () => {
  const website = { name: 'A', url: 'https://a.test/', tag_ids: ['x'] }
  assert.deepEqual(websitePatch(website, { name: 'A', url: 'https://a.test/', tag_ids: ['x'] }), {})
  assert.deepEqual(
    websitePatch(website, { name: 'B', url: 'https://a.test/', tag_ids: ['x', 'y'] }),
    {
      name: 'B',
      tag_ids: ['x', 'y'],
    },
  )
  const account = { is_limit: false }
  assert.deepEqual(accountPatch(account, { password: '', secret_key: '', is_limit: false }), {})
  assert.deepEqual(accountPatch(account, { password: 'p', secret_key: '', is_limit: true }), {
    password: 'p',
    is_limit: true,
  })
})

test('website validation accepts http(s) URLs only and rejects credentials', () => {
  assert.deepEqual(validate.website('Name', 'https://example.com', []), {})
  assert.ok(validate.website('Name', 'javascript:alert(1)', []).url)
  assert.ok(validate.website('Name', 'https://user:pw@example.com', []).url)
  assert.ok(validate.website('', 'https://example.com', []).name)
  assert.ok(validate.website('Name', 'https://example.com', ['a', 'a']).tag_ids)
})

test('tag validation strips leading # and checks the colour', () => {
  assert.equal(validate.tagName('  ##Docs '), 'Docs')
  assert.deepEqual(validate.tag('#Docs', '', '#abcdef'), {})
  assert.ok(validate.tag('#', '', '#abcdef').name)
  assert.ok(validate.tag('Docs', '', 'red').color)
})

test('account validation requires secrets on create but not on edit', () => {
  const values = {
    provider: 'p',
    login_name: 'l',
    external_account_id: '1',
    email: 'a@b.co',
    password: '',
    secret_key: '',
  }
  assert.ok(validate.account(values).password)
  assert.ok(validate.account(values).secret_key)
  assert.deepEqual(validate.account(values, true), {})
  assert.ok(validate.account({ ...values, password: 'x', secret_key: 'y', email: 'bad' }).email)
})
