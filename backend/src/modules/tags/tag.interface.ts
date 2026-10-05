export interface Tag {
  id: string
  name: string
  description: string
  color: string
  created_at: string
  updated_at: string
}

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
