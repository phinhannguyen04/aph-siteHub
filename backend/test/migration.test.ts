import { CredentialsService } from '../src/auth/credentials.service'
import type { AppConfig } from '../src/config/app-config'
import { WebsiteEntity } from '../src/websites/entities/website.entity'
import { TagEntity } from '../src/tags/entities/tag.entity'
import { AdminCredentialEntity } from '../src/auth/entities/admin-credential.entity'
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
      const tags = new TagsService(database.getRepository(TagEntity))
      const sites = new WebsitesService(database.getRepository(WebsiteEntity))
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
      unwrap(await migrateDatabase(database))
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

integration(
  'TypeORM adoption preserves legacy websites, tags, credentials and migration history',
  async () => {
    const fixture = await testDatabase(testUrl!, false)
    try {
      const db = fixture.connection.db
      await db.query(
        await Bun.file(new URL('./fixtures/legacy-schema.sql', import.meta.url)).text(),
      )
      await db.query(
        `CREATE SCHEMA drizzle; CREATE TABLE drizzle.__drizzle_migrations (id serial PRIMARY KEY, hash text NOT NULL, created_at bigint); INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ('legacy-hash', 1)`,
      )
      const tags = new TagsService(db.getRepository(TagEntity))
      const sites = new WebsitesService(db.getRepository(WebsiteEntity))
      const tag = unwrap(
        await tags.create({ name: 'Existing', description: 'Keep me', color: '#166534' }),
      )
      const website = unwrap(
        await sites.create({
          name: 'Existing website',
          url: 'https://existing.example',
          tag_ids: [tag.id],
        }),
      )
      const credentials = new CredentialsService(
        db.getRepository(AdminCredentialEntity),
        {} as AppConfig,
      )
      const credential = { password_hash: 'existing-hash', version: 'existing-version' }
      await db.getRepository(AdminCredentialEntity).upsert({ id: 'primary', ...credential }, ['id'])
      unwrap(await migrateDatabase(db))
      unwrap(await migrateDatabase(db))
      const invalid = await sites.update(website.id, {
        name: 'Must roll back',
        tag_ids: [crypto.randomUUID()],
      })
      expect(invalid.code).toBe(1)
      if (invalid.code !== 0) expect(invalid.error.code).toBe('VALIDATION_ERROR')
      const page = unwrap(await sites.list({ page: 1, pageSize: 12, search: '', tagIds: [] }))
      expect(page.websites).toEqual([website])
      expect(unwrap(await tags.list())).toEqual([tag])
      expect(unwrap(await credentials.current())).toEqual(credential)
      expect(
        await db.query<{ hash: string }[]>('SELECT hash FROM drizzle.__drizzle_migrations'),
      ).toEqual([{ hash: 'legacy-hash' }])
      expect(await db.query<{ name: string }[]>('SELECT name FROM typeorm_migrations')).toEqual([
        { name: 'InitialSchema1791158400000' },
      ])
    } finally {
      await fixture.close()
    }
  },
)
