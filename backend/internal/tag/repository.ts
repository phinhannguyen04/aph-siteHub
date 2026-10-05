import { eq, asc } from 'drizzle-orm'
import type { Database } from '../database/client'
import { tags } from '../database/schema'
import { query } from '../database/error'
import { serviceFailure, success, type ServiceResult } from '../result/result'
import type { Tag } from './model'

export interface Repository {
  list(): Promise<ServiceResult<Tag[]>>
  create(input: Tag): Promise<ServiceResult<Tag>>
  update(
    id: string,
    input: { name: string; description: string; color: string },
  ): Promise<ServiceResult<Tag>>
  delete(id: string): Promise<ServiceResult<void>>
}
const columns = {
  id: tags.id,
  name: tags.name,
  description: tags.description,
  color: tags.color,
  created_at: tags.created_at,
  updated_at: tags.updated_at,
}

export function newRepository(db: Database): Repository {
  return {
    list: () => query(() => db.select(columns).from(tags).orderBy(asc(tags.nameKey))),
    create: (input) =>
      query(async () => {
        const [row] = await db
          .insert(tags)
          .values({ ...input, nameKey: input.name.toLocaleLowerCase('vi') })
          .returning(columns)
        return row!
      }),
    update: async (id, input) => {
      const result = await query(() =>
        db
          .update(tags)
          .set({
            ...input,
            nameKey: input.name.toLocaleLowerCase('vi'),
            updated_at: new Date().toISOString(),
          })
          .where(eq(tags.id, id))
          .returning(columns),
      )
      if (result.code !== 0) return result
      if (!result.data[0]) return serviceFailure('NOT_FOUND', 'Tag not found', 404)
      return success(result.data[0])
    },
    delete: async (id) => {
      const result = await query(() =>
        db.delete(tags).where(eq(tags.id, id)).returning({ id: tags.id }),
      )
      if (result.code !== 0) return result
      if (!result.data[0]) return serviceFailure('NOT_FOUND', 'Tag not found', 404)
      // PostgreSQL cascades only the association rows, preserving websites.
      return success(undefined)
    },
  }
}
