import { table, t } from 'surqlize'

export const websites = table('websites', {
  website_id: t.string(),
  name: t.string(),
  url: t.string(),
  tag_ids: t.array(t.string()),
  search_text: t.string(),
  created_at: t.string(),
  updated_at: t.string(),
})

export const tags = table('tags', {
  tag_id: t.string(),
  name: t.string(),
  name_key: t.string(),
  description: t.string(),
  color: t.string(),
  created_at: t.string(),
  updated_at: t.string(),
})

export const adminCredentials = table('admin_credentials', {
  password_hash: t.string(),
  version: t.string(),
})
