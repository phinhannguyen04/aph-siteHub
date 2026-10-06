import { expect, test } from 'bun:test'
import { defaultWebsiteSearch, parseWebsiteSearch } from '../src/website-search'

const first = '11111111-1111-4111-8111-111111111111'
const second = '22222222-2222-4222-8222-222222222222'

test('router search accepts old URL filters and JSON tag arrays', () => {
  expect(
    parseWebsiteSearch({
      search: 'example',
      page: '2',
      pageSize: '24',
      tagIds: `${first},${second}`,
    }),
  ).toEqual({ search: 'example', page: 2, pageSize: 24, tagIds: [first, second] })
  expect(parseWebsiteSearch({ tagIds: [first, first, second, null, 'invalid'] }).tagIds).toEqual([
    first,
    second,
  ])
})

test('router search normalizes malformed pagination and bounds search inputs', () => {
  expect(parseWebsiteSearch({})).toEqual(defaultWebsiteSearch)
  for (const page of [-1, 0, 1.5, 'invalid', Infinity]) {
    expect(parseWebsiteSearch({ page, pageSize: 999 }).page).toBe(1)
    expect(parseWebsiteSearch({ page, pageSize: 999 }).pageSize).toBe(12)
  }
  expect(parseWebsiteSearch({ search: 'a'.repeat(200) }).search).toHaveLength(160)
})
