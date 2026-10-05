import { EntitySchema } from 'typeorm'
import type { Tag } from '../tags/tag.interface'
import type { Credential } from '../auth/credentials.service'

export interface WebsiteRecord {
  id: string
  name: string
  url: string
  searchText: string
  created_at: string
  updated_at: string
}
export interface TagRecord extends Tag {
  nameKey: string
}
export interface WebsiteTagRecord {
  websiteId: string
  tagId: string
  position: number
  tag: TagRecord
  website: WebsiteRecord
}
export interface CredentialRecord extends Credential {
  id: string
}

export const websites = new EntitySchema<WebsiteRecord>({
  name: 'Website',
  tableName: 'websites',
  columns: {
    id: { type: 'text', name: 'website_id', primary: true },
    name: { type: 'text' },
    url: { type: 'text' },
    searchText: { type: 'text', name: 'search_text' },
    created_at: { type: 'text' },
    updated_at: { type: 'text' },
  },
  indices: [{ name: 'websites_created_id_idx', columns: ['created_at', 'id'] }],
})
export const tags = new EntitySchema<TagRecord>({
  name: 'Tag',
  tableName: 'tags',
  columns: {
    id: { type: 'text', name: 'tag_id', primary: true },
    name: { type: 'text' },
    nameKey: { type: 'text', name: 'name_key' },
    description: { type: 'text' },
    color: { type: 'text' },
    created_at: { type: 'text' },
    updated_at: { type: 'text' },
  },
  indices: [{ name: 'tags_name_key_unique', columns: ['nameKey'], unique: true }],
})
export const websiteTags = new EntitySchema<WebsiteTagRecord>({
  name: 'WebsiteTag',
  tableName: 'website_tags',
  columns: {
    websiteId: { type: 'text', name: 'website_id', primary: true },
    tagId: { type: 'text', name: 'tag_id', primary: true },
    position: { type: 'integer' },
  },
  relations: {
    website: {
      type: 'many-to-one',
      target: 'Website',
      joinColumn: { name: 'website_id', referencedColumnName: 'id' },
      onDelete: 'CASCADE',
    },
    tag: {
      type: 'many-to-one',
      target: 'Tag',
      joinColumn: { name: 'tag_id', referencedColumnName: 'id' },
      onDelete: 'CASCADE',
    },
  },
  indices: [{ name: 'website_tags_tag_idx', columns: ['tagId'] }],
})
export const adminCredentials = new EntitySchema<CredentialRecord>({
  name: 'AdminCredential',
  tableName: 'admin_credentials',
  columns: {
    id: { type: 'text', primary: true },
    password_hash: { type: 'text' },
    version: { type: 'text' },
  },
})
export function toTag(row: TagRecord): Tag {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    color: row.color,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}
