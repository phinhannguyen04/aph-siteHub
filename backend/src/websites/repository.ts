import { and, count, desc, eq, exists, inArray, sql } from 'drizzle-orm'
import type { Database, Executor } from '../database/client'
import { websites, tags, websiteTags } from '../database/schema'
import { query } from '../database/error'
import { serviceFailure, type ServiceResult } from '../common/errors/result'
import type { Website } from './website.interface'
import type { ListQuery } from './list-query'
import { fold } from './search'

export interface WebsitePage {
  websites: Website[]
  total: number
  page: number
  pageSize: number
}
export interface WebsiteWrite {
  id: string
  name: string
  url: string
  tag_ids: string[]
  searchText: string
  created_at: string
  updated_at: string
}
export interface Repository {
  list(input: ListQuery): Promise<ServiceResult<WebsitePage>>
  count(): Promise<ServiceResult<number>>
  create(input: WebsiteWrite): Promise<ServiceResult<Website>>
  update(
    id: string,
    input: { name?: string; url?: string; tag_ids?: string[] },
  ): Promise<ServiceResult<Website>>
}

async function hydrate(db: Executor, rows: (typeof websites.$inferSelect)[]): Promise<Website[]> {
  if (!rows.length) return []
  const links = await db
    .select({
      websiteId: websiteTags.websiteId,
      tag: {
        id: tags.id,
        name: tags.name,
        description: tags.description,
        color: tags.color,
        created_at: tags.created_at,
        updated_at: tags.updated_at,
      },
    })
    .from(websiteTags)
    .innerJoin(tags, eq(websiteTags.tagId, tags.id))
    .where(
      inArray(
        websiteTags.websiteId,
        rows.map((row) => row.id),
      ),
    )
    .orderBy(websiteTags.position)
  return rows.map((row) => {
    const assigned = links.filter((link) => link.websiteId === row.id).map((link) => link.tag)
    return {
      id: row.id,
      name: row.name,
      url: row.url,
      created_at: row.created_at,
      updated_at: row.updated_at,
      tag_ids: assigned.map((tag) => tag.id),
      tags: assigned,
    }
  })
}

export function newRepository(db: Database): Repository {
  return {
    list: (input) =>
      query(() =>
        db.transaction(
          async (tx) => {
            const filter = and(
              input.search
                ? sql`strpos(${websites.searchText}, ${fold(input.search)}) > 0`
                : undefined,
              input.tagIds.length
                ? exists(
                    tx
                      .select({ id: websiteTags.websiteId })
                      .from(websiteTags)
                      .where(
                        and(
                          eq(websiteTags.websiteId, websites.id),
                          inArray(websiteTags.tagId, input.tagIds),
                        ),
                      ),
                  )
                : undefined,
            )
            const [total] = await tx.select({ count: count() }).from(websites).where(filter)
            const rows = await tx
              .select()
              .from(websites)
              .where(filter)
              .orderBy(desc(websites.created_at), desc(websites.id))
              .limit(input.pageSize)
              .offset((input.page - 1) * input.pageSize)
            return {
              websites: await hydrate(tx, rows),
              total: total?.count ?? 0,
              page: input.page,
              pageSize: input.pageSize,
            }
          },
          { isolationLevel: 'repeatable read', accessMode: 'read only' },
        ),
      ),
    count: () =>
      query(async () => {
        const [row] = await db.select({ count: count() }).from(websites)
        return row?.count ?? 0
      }),
    create: (input) =>
      query(() =>
        db.transaction(async (tx) => {
          const { tag_ids, ...row } = input
          await tx.insert(websites).values(row)
          if (tag_ids.length)
            await tx
              .insert(websiteTags)
              .values(tag_ids.map((tagId, position) => ({ websiteId: row.id, tagId, position })))
          return (await hydrate(tx, [row]))[0]!
        }),
      ),
    update: async (id, input) => {
      const result = await query(() =>
        db.transaction(async (tx) => {
          const [existing] = await tx
            .select()
            .from(websites)
            .where(eq(websites.id, id))
            .for('update')
          if (!existing) return null
          const name = input.name ?? existing.name
          const url = input.url ?? existing.url
          const [row] = await tx
            .update(websites)
            .set({
              name,
              url,
              searchText: fold(name + ' ' + url),
              updated_at: new Date().toISOString(),
            })
            .where(eq(websites.id, id))
            .returning()
          if (input.tag_ids !== undefined) {
            await tx.delete(websiteTags).where(eq(websiteTags.websiteId, id))
            if (input.tag_ids.length)
              await tx
                .insert(websiteTags)
                .values(
                  input.tag_ids.map((tagId, position) => ({ websiteId: id, tagId, position })),
                )
          }
          return (await hydrate(tx, [row!]))[0]!
        }),
      )
      if (result.code !== 0) return result
      if (!result.data) return serviceFailure('NOT_FOUND', 'Website not found', 404)
      return { code: 0, data: result.data }
    },
  }
}
