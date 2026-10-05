import { integer, pgTable, primaryKey, text, uniqueIndex, index } from 'drizzle-orm/pg-core'

export const websites = pgTable(
  'websites',
  {
    id: text('website_id').primaryKey(),
    name: text('name').notNull(),
    url: text('url').notNull(),
    searchText: text('search_text').notNull(),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
  },
  (table) => [index('websites_created_id_idx').on(table.created_at, table.id)],
)

export const tags = pgTable(
  'tags',
  {
    id: text('tag_id').primaryKey(),
    name: text('name').notNull(),
    nameKey: text('name_key').notNull(),
    description: text('description').notNull(),
    color: text('color').notNull(),
    created_at: text('created_at').notNull(),
    updated_at: text('updated_at').notNull(),
  },
  (table) => [uniqueIndex('tags_name_key_unique').on(table.nameKey)],
)

export const websiteTags = pgTable(
  'website_tags',
  {
    websiteId: text('website_id')
      .notNull()
      .references(() => websites.id, { onDelete: 'cascade' }),
    tagId: text('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.websiteId, table.tagId] }),
    index('website_tags_tag_idx').on(table.tagId),
  ],
)

export const adminCredentials = pgTable('admin_credentials', {
  id: text('id').primaryKey(),
  password_hash: text('password_hash').notNull(),
  version: text('version').notNull(),
})
