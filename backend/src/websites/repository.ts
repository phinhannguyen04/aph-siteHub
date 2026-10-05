import { In, type EntityManager } from 'typeorm'
import type { Database } from '../database/client'
import { websites, websiteTags, toTag, type WebsiteRecord } from '../database/schema'
import { query } from '../database/error'
import { serviceFailure, success, type ServiceResult } from '../common/errors/result'
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
async function hydrate(tx: EntityManager, rows: WebsiteRecord[]): Promise<Website[]> {
  if (!rows.length) return []
  const links = await tx.getRepository(websiteTags).find({
    where: { websiteId: In(rows.map((row) => row.id)) },
    relations: { tag: true },
    order: { position: 'ASC' },
  })
  return rows.map((row) => {
    const assigned = links
      .filter((link) => link.websiteId === row.id)
      .map((link) => toTag(link.tag))
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
        db.transaction('REPEATABLE READ', async (tx) => {
          await tx.query('SET TRANSACTION READ ONLY')
          const sites = tx.getRepository(websites).createQueryBuilder('site')
          if (input.search)
            sites.andWhere('strpos(site.search_text, :search) > 0', { search: fold(input.search) })
          if (input.tagIds.length)
            sites.andWhere(
              'EXISTS (SELECT 1 FROM website_tags link WHERE link.website_id = site.website_id AND link.tag_id IN (:...tagIds))',
              { tagIds: input.tagIds },
            )
          const total = await sites.getCount()
          const rows = await sites
            .orderBy('site.created_at', 'DESC')
            .addOrderBy('site.id', 'DESC')
            .take(input.pageSize)
            .skip((input.page - 1) * input.pageSize)
            .getMany()
          return {
            websites: await hydrate(tx, rows),
            total,
            page: input.page,
            pageSize: input.pageSize,
          }
        }),
      ),
    count: () => query(() => db.getRepository(websites).count()),
    create: (input) =>
      query(() =>
        db.transaction(async (tx) => {
          const { tag_ids, ...row } = input
          await tx.getRepository(websites).insert(row)
          if (tag_ids.length)
            await tx
              .getRepository(websiteTags)
              .insert(tag_ids.map((tagId, position) => ({ websiteId: row.id, tagId, position })))
          return (await hydrate(tx, [row]))[0]!
        }),
      ),
    update: async (id, input) => {
      const result = await query(() =>
        db.transaction(async (tx) => {
          const repo = tx.getRepository(websites)
          const existing = await repo.findOne({
            where: { id },
            lock: { mode: 'pessimistic_write' },
          })
          if (!existing) return null
          const name = input.name ?? existing.name
          const url = input.url ?? existing.url
          const row = {
            ...existing,
            name,
            url,
            searchText: fold(name + ' ' + url),
            updated_at: new Date().toISOString(),
          }
          await repo.update(id, row)
          if (input.tag_ids !== undefined) {
            await tx.getRepository(websiteTags).delete({ websiteId: id })
            if (input.tag_ids.length)
              await tx
                .getRepository(websiteTags)
                .insert(
                  input.tag_ids.map((tagId, position) => ({ websiteId: id, tagId, position })),
                )
          }
          return (await hydrate(tx, [row]))[0]!
        }),
      )
      if (result.code !== 0) return result
      if (!result.data) return serviceFailure('NOT_FOUND', 'Website not found', 404)
      return success(result.data)
    },
  }
}
