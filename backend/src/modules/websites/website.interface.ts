import type { Tag } from '../tags/tag.interface'
export interface Website {
  id: string
  name: string
  url: string
  created_at: string
  updated_at: string
  tag_ids: string[]
  tags: Tag[]
}
