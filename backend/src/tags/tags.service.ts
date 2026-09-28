import { HttpException, Inject, Injectable } from '@nestjs/common'
import type { Surreal } from 'surrealdb'
import { DATABASE } from '../database/database.tokens'
import { apiError } from '../common/errors/api-error'
import type { Tag } from './tag.interface'

type TagRecord = Omit<Tag, 'id'> & { tag_id: string }
function toTag(record: TagRecord): Tag {
  return {
    id: record.tag_id,
    name: record.name,
    description: record.description,
    color: record.color,
    created_at: record.created_at,
    updated_at: record.updated_at,
  }
}
function conflict(error: unknown): never {
  if (error instanceof Error && /unique|already contains|index/i.test(error.message))
    throw new HttpException(apiError('CONFLICT', 'A tag with this name already exists'), 409)
  throw error
}
@Injectable()
export class TagsService {
  constructor(@Inject(DATABASE) private readonly db: Surreal) {}
  async list(): Promise<Tag[]> {
    const [rows] = await this.db.query<[TagRecord[]]>(
      'SELECT tag_id, name, description, color, created_at, updated_at FROM tags ORDER BY name_key ASC',
    )
    return rows.map(toTag)
  }
  async create(input: { name: string; description: string; color: string }): Promise<Tag> {
    const now = new Date().toISOString()
    const tag: Tag = { id: crypto.randomUUID(), ...input, created_at: now, updated_at: now }
    try {
      await this.db.query(
        'CREATE tags CONTENT { tag_id: $id, name: $name, name_key: $key, description: $description, color: $color, created_at: $now, updated_at: $now }',
        { ...input, id: tag.id, key: input.name.toLocaleLowerCase('vi'), now },
      )
    } catch (error) {
      conflict(error)
    }
    return tag
  }
  async update(
    id: string,
    input: { name: string; description: string; color: string },
  ): Promise<Tag> {
    try {
      const [rows] = await this.db.query<[TagRecord[]]>(
        'UPDATE tags SET name = $name, name_key = $key, description = $description, color = $color, updated_at = $now WHERE tag_id = $id RETURN AFTER',
        { ...input, id, key: input.name.toLocaleLowerCase('vi'), now: new Date().toISOString() },
      )
      if (!rows[0]) throw new HttpException(apiError('NOT_FOUND', 'Tag not found'), 404)
      return toTag(rows[0])
    } catch (error) {
      conflict(error)
    }
  }
  async delete(id: string): Promise<void> {
    const [found] = await this.db.query<[{ tag_id: string }[]]>(
      'SELECT tag_id FROM tags WHERE tag_id = $id LIMIT 1',
      { id },
    )
    if (!found.length) throw new HttpException(apiError('NOT_FOUND', 'Tag not found'), 404)
    await this.db.query(
      'BEGIN TRANSACTION; UPDATE websites SET tag_ids = array::difference(tag_ids, [$id]) WHERE tag_ids CONTAINS $id; DELETE tags WHERE tag_id = $id; COMMIT TRANSACTION;',
      { id },
    )
  }
}
