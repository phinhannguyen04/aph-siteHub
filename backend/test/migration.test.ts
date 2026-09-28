import { expect, test } from 'bun:test'
import { connectDb } from '../src/database/surreal.client'
import { backfillWebsiteSearch } from '../src/websites/search-backfill'
const testUrl = Bun.env.SURREAL_TEST_URL
const integration = testUrl ? test : test.skip
integration('upgrade preserves old websites and backfills search', async () => {
  const db = await connectDb({
    surrealUrl: testUrl!,
    surrealUser: Bun.env.SURREAL_USER || 'root',
    surrealPass: Bun.env.SURREAL_PASS || '',
    surrealNamespace: 'sitehub_tests',
    surrealDatabase: `migration_${crypto.randomUUID().replaceAll('-', '')}`,
  })
  try {
    for (const name of ['001_websites.surql', '002_admin_credentials.surql'])
      await db.query(await Bun.file(new URL(`../migrations/${name}`, import.meta.url)).text())
    await db.query(
      'CREATE websites CONTENT { website_id: $id, name: $name, url: $url, created_at: $now, updated_at: $now }',
      { id: 'old', name: 'Đường dẫn', url: 'https://example.com', now: new Date().toISOString() },
    )
    const migration = await Bun.file(
      new URL('../migrations/003_tags.surql', import.meta.url),
    ).text()
    await db.query(migration)
    await backfillWebsiteSearch(db)
    const [rows] = await db.query<[{ tag_ids: string[]; search_text: string }[]]>(
      'SELECT tag_ids, search_text FROM websites WHERE website_id = "old"',
    )
    expect(rows[0]?.tag_ids).toEqual([])
    expect(rows[0]?.search_text).toContain('duong dan')
    await db.query(migration)
    await backfillWebsiteSearch(db)
    const [again] = await db.query<[{ website_id: string }[]]>('SELECT website_id FROM websites')
    expect(again).toHaveLength(1)
  } finally {
    await db.close()
  }
})
