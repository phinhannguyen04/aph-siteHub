import type { Database } from '../database/client'
import { tags, toTag } from '../database/schema'
import { query } from '../database/error'
import { serviceFailure, success, type ServiceResult } from '../common/errors/result'
import type { Tag } from './tag.interface'
export interface Repository {
  list(): Promise<ServiceResult<Tag[]>>
  create(input: Tag): Promise<ServiceResult<Tag>>
  update(
    id: string,
    input: { name: string; description: string; color: string },
  ): Promise<ServiceResult<Tag>>
  delete(id: string): Promise<ServiceResult<void>>
}
export function newRepository(db: Database): Repository {
  return {
    list: () =>
      query(async () =>
        (await db.getRepository(tags).find({ order: { nameKey: 'ASC' } })).map(toTag),
      ),
    create: (input) =>
      query(async () => {
        await db
          .getRepository(tags)
          .insert({ ...input, nameKey: input.name.toLocaleLowerCase('vi') })
        return input
      }),
    update: async (id, input) => {
      const result = await query(() =>
        db.transaction(async (tx) => {
          const repo = tx.getRepository(tags)
          const write = await repo.update(id, {
            ...input,
            nameKey: input.name.toLocaleLowerCase('vi'),
            updated_at: new Date().toISOString(),
          })
          if (!write.affected) return null
          const row = await repo.findOneBy({ id })
          return row ? toTag(row) : null
        }),
      )
      if (result.code !== 0) return result
      if (!result.data) return serviceFailure('NOT_FOUND', 'Tag not found', 404)
      return success(result.data)
    },
    delete: async (id) => {
      const result = await query(() => db.getRepository(tags).delete(id))
      if (result.code !== 0) return result
      if (!result.data.affected) return serviceFailure('NOT_FOUND', 'Tag not found', 404)
      return success(undefined)
    },
  }
}
