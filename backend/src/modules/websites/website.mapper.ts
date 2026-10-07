import type { WebsiteEntity } from './entities/website.entity'
import type { Website } from './website.interface'
import type { Tag } from '../tags/tag.interface'
import { toTag } from '../tags/tag.mapper'

/**
 * Build a public website response with ordered tags and tag IDs, excluding internal
 * search fields.
 */
export function toWebsite(row: WebsiteEntity, assigned: Tag[]): Website {
  const tags = assigned.map(toTag)

  return {
    id: row.id,
    name: row.name,
    url: row.url,
    created_at: row.created_at,
    updated_at: row.updated_at,
    tag_ids: tags.map((tag) => tag.id),
    tags,
  }
}
