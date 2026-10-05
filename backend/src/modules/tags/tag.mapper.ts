import type { Tag } from './tag.interface'

export function toTag(row: Tag): Tag {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    color: row.color,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}
