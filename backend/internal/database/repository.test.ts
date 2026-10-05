import { expect, test } from 'bun:test'
import { testDatabase, unwrap } from '../testutil/helpers'
import { newRepository as websiteRepository } from '../website/repository'
import { newRepository as tagRepository } from '../tag/repository'
import { newRepository as authRepository } from '../auth/repository'
import { WebsitesService } from '../website/service'
import { TagsService } from '../tag/service'

const testUrl = Bun.env.POSTGRES_TEST_URL
const integration = testUrl ? test : test.skip

integration(
  'website failures roll back fields and links, while tag deletion preserves websites',
  async () => {
    const fixture = await testDatabase(testUrl!)
    const tags = new TagsService(tagRepository(fixture.connection.db))
    const sites = new WebsitesService(websiteRepository(fixture.connection.db))
    const tag = unwrap(await tags.create({ name: 'Team', description: '', color: '#166534' }))
    const site = unwrap(
      await sites.create({ name: 'Original', url: 'https://example.com', tag_ids: [tag.id] }),
    )
    expect(
      (
        await sites.create({
          name: 'Rejected',
          url: 'https://example.com',
          tag_ids: [crypto.randomUUID()],
        })
      ).code,
    ).toBe(1)
    expect(unwrap(await sites.count())).toBe(1)
    const update = await sites.update(site.id, {
      name: 'Rejected',
      url: 'https://changed.example',
      tag_ids: [crypto.randomUUID()],
    })
    expect(update.code).toBe(1)
    if (update.code !== 0) expect(update.error.status).toBe(400)
    const input = { page: 1, pageSize: 12, search: '', tagIds: [] }
    expect(unwrap(await sites.list(input)).websites[0]).toEqual(site)
    expect((await tags.delete(tag.id)).code).toBe(0)
    const retained = unwrap(await sites.list(input)).websites[0]!
    expect(retained.id).toBe(site.id)
    expect(retained.tag_ids).toEqual([])
    expect(retained.tags).toEqual([])
    await fixture.close()
  },
)

integration(
  'concurrent credential initialization and compare-and-swap have one winner',
  async () => {
    const fixture = await testDatabase(testUrl!)
    const repository = authRepository(fixture.connection.db)
    const results = await Promise.all([
      repository.initialize({ password_hash: 'hash-one', version: 'one' }),
      repository.initialize({ password_hash: 'hash-two', version: 'two' }),
    ])
    const winning = unwrap(results[0]!)
    expect(unwrap(results[1]!)).toEqual(winning)
    const replacements = await Promise.all([
      repository.replace({ password_hash: 'new-one', version: 'new-one' }, winning.version),
      repository.replace({ password_hash: 'new-two', version: 'new-two' }, winning.version),
    ])
    expect(replacements.map((result) => unwrap(result)).filter(Boolean)).toHaveLength(1)
    expect(replacements.map((result) => unwrap(result)).filter((row) => row === null)).toHaveLength(
      1,
    )
    await fixture.close()
  },
)

integration(
  'Drizzle search treats SQL wildcards literally and preserves accent folding',
  async () => {
    const fixture = await testDatabase(testUrl!)
    const sites = new WebsitesService(websiteRepository(fixture.connection.db))
    for (const name of ['100% done', 'under_score', 'Đường dẫn'])
      unwrap(await sites.create({ name, url: 'https://example.com' }))
    for (const [search, expected] of [
      ['%', '100% done'],
      ['_', 'under_score'],
      ['duong dan', 'Đường dẫn'],
    ]) {
      const result = unwrap(
        await sites.list({ page: 1, pageSize: 12, search: search!, tagIds: [] }),
      )
      expect(result.total).toBe(1)
      expect(result.websites[0]?.name).toBe(expected)
    }
    await fixture.close()
  },
)
