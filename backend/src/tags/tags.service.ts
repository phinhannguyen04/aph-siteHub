import { Inject, Injectable } from '@nestjs/common'
import type { Surreal } from 'surrealdb'
import { DATABASE, ORM } from '../database/database.tokens'
import type { SiteOrm } from '../database/database.module'
import {
  attempt,
  operation,
  serviceFailure,
  success,
  unexpectedFailure,
  type ServiceResult,
} from '../common/errors/result'
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
function conflict(error: unknown): ServiceResult<never> {
  if (error instanceof Error && /unique|already contains|index/i.test(error.message))
    return serviceFailure('CONFLICT', 'A tag with this name already exists', 409)
  return unexpectedFailure(error)
}
@Injectable()
export class TagsService {
  constructor(
    @Inject(DATABASE) private readonly db: Surreal,
    @Inject(ORM) private readonly orm: SiteOrm,
  ) {}
  async list(): Promise<ServiceResult<Tag[]>> {
    return operation(async () => {
      const rows = await this.orm.select('tags').orderBy('name_key', 'ASC')
      return success(rows.map(toTag))
    })
  }
  async create(input: {
    name: string
    description: string
    color: string
  }): Promise<ServiceResult<Tag>> {
    return operation(async () => {
      const now = new Date().toISOString()
      const tag: Tag = { id: crypto.randomUUID(), ...input, created_at: now, updated_at: now }
      const write = await attempt(() =>
        this.orm.create('tags').content({
          tag_id: tag.id,
          ...input,
          name_key: input.name.toLocaleLowerCase('vi'),
          created_at: now,
          updated_at: now,
        }),
      )
      if (write.code !== 0) return conflict(write.error)
      return success(tag)
    })
  }
  async update(
    id: string,
    input: { name: string; description: string; color: string },
  ): Promise<ServiceResult<Tag>> {
    return operation(async () => {
      const write = await attempt(() =>
        this.orm
          .update('tags')
          .where((tag) => tag.tag_id.eq(id))
          .set({
            ...input,
            name_key: input.name.toLocaleLowerCase('vi'),
            updated_at: new Date().toISOString(),
          })
          .return('after'),
      )
      if (write.code !== 0) return conflict(write.error)
      if (!write.data[0]) return serviceFailure('NOT_FOUND', 'Tag not found', 404)
      return success(toTag(write.data[0]))
    })
  }
  async delete(id: string): Promise<ServiceResult<void>> {
    return operation(async () => {
      const [found] = await this.db.query<[{ tag_id: string }[]]>(
        'SELECT tag_id FROM tags WHERE tag_id = $id LIMIT 1',
        { id },
      )
      if (!found.length) return serviceFailure('NOT_FOUND', 'Tag not found', 404)
      await this.db.query(
        'BEGIN TRANSACTION; UPDATE websites SET tag_ids = array::difference(tag_ids, [$id]) WHERE tag_ids CONTAINS $id; DELETE tags WHERE tag_id = $id; COMMIT TRANSACTION;',
        { id },
      )
      return success(undefined)
    })
  }
}
