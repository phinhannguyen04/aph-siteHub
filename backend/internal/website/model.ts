import type { Tag } from '../tag/model'
export interface Website {
  id: string
  name: string
  url: string
  created_at: string
  updated_at: string
  tag_ids: string[]
  tags: Tag[]
}
