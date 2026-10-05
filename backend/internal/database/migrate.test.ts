import { expect, test } from 'bun:test'
import { testDatabase, unwrap } from '../testutil/helpers'
import { migrateDatabase } from './migrate'
import { WebsitesService } from '../website/service'
import { TagsService } from '../tag/service'
import { newRepository as websiteRepository } from '../website/repository'
import { newRepository as tagRepository } from '../tag/repository'

const testUrl = Bun.env.POSTGRES_TEST_URL
const integration = testUrl ? test : test.skip

integration(
  'reapplying PostgreSQL migrations preserves website records and ordered tag links',
  async () => {
    const fixture = await testDatabase(testUrl!)
    const database = fixture.connection.db
    const tags = new TagsService(tagRepository(database))
    const sites = new WebsitesService(websiteRepository(database))
    const first = unwrap(await tags.create({ name: 'First', description: '', color: '#166534' }))
    const second = unwrap(await tags.create({ name: 'Second', description: '', color: '#166534' }))
    const website = unwrap(
      await sites.create({
        name: 'Đường dẫn',
        url: 'https://example.com',
        tag_ids: [second.id, first.id],
      }),
    )
    await migrateDatabase(database)
    const page = unwrap(
      await sites.list({ page: 1, pageSize: 12, search: 'duong dan', tagIds: [] }),
    )
    expect(page.total).toBe(1)
    expect(page.websites).toEqual([website])
    expect(page.websites[0]?.tag_ids).toEqual([second.id, first.id])
    await fixture.close()
  },
)
