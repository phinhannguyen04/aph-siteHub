import { backfillWebsiteSearch } from '../src/websites/search-backfill'
import { httpData as unwrap } from '../src/common/errors/result'
import { expect, test } from 'bun:test'
import { testDatabase } from './helpers'
import { migrateDatabase } from '../src/database/migrate'
import { WebsitesService } from '../src/websites/websites.service'
import { TagsService } from '../src/tags/tags.service'

const testUrl = Bun.env.POSTGRES_TEST_URL
const integration = testUrl ? test : test.skip

integration(
  'reapplying PostgreSQL migrations preserves website records and ordered tag links',
  async () => {
    const fixture = await testDatabase(testUrl!)
    try {
      const database = fixture.connection.db
      const tags = new TagsService(database)
      const sites = new WebsitesService(database)
      const first = unwrap(await tags.create({ name: 'First', description: '', color: '#166534' }))
      const second = unwrap(
        await tags.create({ name: 'Second', description: '', color: '#166534' }),
      )
      const website = unwrap(
        await sites.create({
          name: 'Đường dẫn',
          url: 'https://example.com',
          tag_ids: [second.id, first.id],
        }),
      )
      await database
        .update((await import('../src/database/schema')).websites)
        .set({ searchText: '' })
      await migrateDatabase(database)
      await backfillWebsiteSearch(database)
      const page = unwrap(
        await sites.list({ page: 1, pageSize: 12, search: 'duong dan', tagIds: [] }),
      )
      expect(page.total).toBe(1)
      expect(page.websites).toEqual([website])
      expect(page.websites[0]?.tag_ids).toEqual([second.id, first.id])
    } finally {
      await fixture.close()
    }
  },
)
