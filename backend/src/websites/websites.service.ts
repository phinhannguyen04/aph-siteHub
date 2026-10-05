import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository, type EntityManager } from 'typeorm'
import { WebsiteEntity } from './entities/website.entity'
import { WebsiteTagEntity } from './entities/website-tag.entity'
import { toTag } from '../tags/tag.interface'
import { query } from '../database/error'
import { operation, serviceFailure, success, type ServiceResult } from '../common/errors/result'
import type { Website } from './website.interface'
import type { ListQuery } from './list-query'
import { fold } from './search'

export interface WebsitePage {
  websites: Website[]
  total: number
  page: number
  pageSize: number
}
function validTags(ids: string[]) {
  return (
    ids.length <= 50 &&
    ids.every((id) => /^[0-9a-f-]{36}$/i.test(id)) &&
    new Set(ids).size === ids.length
  )
}
@Injectable()
export class WebsitesService {
  constructor(
    @InjectRepository(WebsiteEntity) private readonly websites: Repository<WebsiteEntity>,
  ) {}
  private async hydrate(tx: EntityManager, rows: WebsiteEntity[]): Promise<Website[]> {
    if (!rows.length) return []
    const links = await tx.getRepository(WebsiteTagEntity).find({
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
  list(input: ListQuery): Promise<ServiceResult<WebsitePage>> {
    return query(() =>
      this.websites.manager.transaction('REPEATABLE READ', async (tx) => {
        await tx.query('SET TRANSACTION READ ONLY')
        const sites = tx.getRepository(WebsiteEntity).createQueryBuilder('site')
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
          websites: await this.hydrate(tx, rows),
          total,
          page: input.page,
          pageSize: input.pageSize,
        }
      }),
    )
  }
  count(): Promise<ServiceResult<number>> {
    return query(() => this.websites.count())
  }
  create(input: {
    name: string
    url: string
    tag_ids?: string[]
  }): Promise<ServiceResult<Website>> {
    const ids = input.tag_ids ?? []
    if (!validTags(ids))
      return Promise.resolve(serviceFailure('VALIDATION_ERROR', 'Invalid tag IDs', 400))
    return operation(async () => {
      const now = new Date().toISOString()
      const row = {
        id: crypto.randomUUID(),
        name: input.name,
        url: input.url,
        searchText: fold(input.name + ' ' + input.url),
        created_at: now,
        updated_at: now,
      }
      return query(() =>
        this.websites.manager.transaction(async (tx) => {
          await tx.getRepository(WebsiteEntity).insert(row)
          if (ids.length)
            await tx
              .getRepository(WebsiteTagEntity)
              .insert(ids.map((tagId, position) => ({ websiteId: row.id, tagId, position })))
          return (await this.hydrate(tx, [row]))[0]!
        }),
      )
    })
  }
  async update(
    id: string,
    input: { name?: string; url?: string; tag_ids?: string[] },
  ): Promise<ServiceResult<Website>> {
    if (input.tag_ids !== undefined && !validTags(input.tag_ids))
      return serviceFailure('VALIDATION_ERROR', 'Invalid tag IDs', 400)
    const result = await query(() =>
      this.websites.manager.transaction(async (tx) => {
        const repo = tx.getRepository(WebsiteEntity)
        const existing = await repo.findOne({ where: { id }, lock: { mode: 'pessimistic_write' } })
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
          await tx.getRepository(WebsiteTagEntity).delete({ websiteId: id })
          if (input.tag_ids.length)
            await tx
              .getRepository(WebsiteTagEntity)
              .insert(input.tag_ids.map((tagId, position) => ({ websiteId: id, tagId, position })))
        }
        return (await this.hydrate(tx, [row]))[0]!
      }),
    )
    if (result.code !== 0) return result
    if (!result.data) return serviceFailure('NOT_FOUND', 'Website not found', 404)
    return success(result.data)
  }
}
