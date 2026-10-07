import type { Tag } from './tag.interface'

/** Select the public tag fields without exposing internal persistence fields such as nameKey. */
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
