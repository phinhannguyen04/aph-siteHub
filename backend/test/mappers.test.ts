import { expect, test } from 'bun:test'
import { toWebsite } from '../src/modules/websites/website.mapper'
import { toTag } from '../src/modules/tags/tag.mapper'

test('response mappers omit persistence fields and preserve ordered tag IDs', () => {
  const tag = {
    id: 'tag-1',
    name: 'Team',
    nameKey: 'team',
    description: '',
    color: '#123456',
    created_at: 'created',
    updated_at: 'updated',
  }
  const other = { ...tag, id: 'tag-2' }
  const website = {
    id: 'site-1',
    name: 'Site',
    url: 'https://example.com/',
    searchText: 'internal index',
    created_at: 'created',
    updated_at: 'updated',
  }
  const result = toWebsite(website, [other, tag])
  expect(result.tag_ids).toEqual(['tag-2', 'tag-1'])
  expect(result.tags.map((item) => item.id)).toEqual(result.tag_ids)
  expect(result).not.toHaveProperty('searchText')
  expect(result.tags[0]).not.toHaveProperty('nameKey')
  expect(toTag(tag)).not.toHaveProperty('nameKey')
  expect(toWebsite(website, []).tags).toEqual([])
  expect(toWebsite(website, []).tag_ids).toEqual([])
})
