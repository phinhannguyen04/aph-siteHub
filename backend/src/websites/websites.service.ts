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
import type { Website } from './website.interface'
import { fold } from './search'
import type { ListQuery } from './list-query'
type WebsiteRecord = Omit<Website, 'id' | 'tags'> & { website_id: string; tag_ids?: string[] }
@Injectable()
export class WebsitesService {
  constructor(
    @Inject(DATABASE) private readonly db: Surreal,
    @Inject(ORM) private readonly orm: SiteOrm,
  ) {}
  private async hydrate(rows: WebsiteRecord[]): Promise<Website[]> {
    const ids = [...new Set(rows.flatMap((row) => row.tag_ids ?? []))]
    const tags = ids.length
      ? await this.orm.select('tags').where((tag) => tag.tag_id.inside(ids))
      : []
    const byId = new Map(
      tags.map((tag) => [
        tag.tag_id,
        {
          id: tag.tag_id,
          name: tag.name,
          description: tag.description,
          color: tag.color,
          created_at: tag.created_at,
          updated_at: tag.updated_at,
        },
      ]),
    )
    return rows.map((row) => ({
      id: row.website_id,
      name: row.name,
      url: row.url,
      created_at: row.created_at,
      updated_at: row.updated_at,
      tag_ids: row.tag_ids ?? [],
      tags: (row.tag_ids ?? [])
        .map((id) => byId.get(id))
        .filter((tag): tag is NonNullable<typeof tag> => !!tag),
    }))
  }
  async list(
    query: ListQuery,
  ): Promise<
    ServiceResult<{ websites: Website[]; total: number; page: number; pageSize: number }>
  > {
    return operation(async () => {
      const bindings = {
        search: fold(query.search),
        tagIds: query.tagIds,
        limit: query.pageSize,
        start: (query.page - 1) * query.pageSize,
      }
      const where =
        'WHERE ($search = "" OR string::contains(search_text, $search)) AND (array::len($tagIds) = 0 OR tag_ids CONTAINSANY $tagIds)'
      const [count] = await this.db.query<[{ total: number }[]]>(
        `SELECT count() AS total FROM websites ${where} GROUP ALL`,
        bindings,
      )
      const sites = this.orm.select('websites')
      if (bindings.search && bindings.tagIds.length) {
        sites.where((site) =>
          site.search_text.contains(bindings.search).and(site.tag_ids.containsAny(bindings.tagIds)),
        )
      } else if (bindings.search) {
        sites.where((site) => site.search_text.contains(bindings.search))
      } else if (bindings.tagIds.length) {
        sites.where((site) => site.tag_ids.containsAny(bindings.tagIds))
      }
      const rows = await sites
        .orderBy('created_at', 'DESC')
        .orderBy('website_id', 'DESC')
        .limit(bindings.limit)
        .start(bindings.start)
      return success({
        websites: await this.hydrate(rows),
        total: Number(count[0]?.total ?? 0),
        page: query.page,
        pageSize: query.pageSize,
      })
    })
  }
  async count(): Promise<ServiceResult<number>> {
    return operation(async () => {
      const [rows] = await this.db.query<[{ total: number }[]]>(
        'SELECT count() AS total FROM websites GROUP ALL',
      )
      return success(Number(rows[0]?.total ?? 0))
    })
  }
  private async validTags(ids: string[]): Promise<ServiceResult<void>> {
    return operation(async () => {
      if (
        ids.length > 50 ||
        ids.some((id) => !/^[0-9a-f-]{36}$/i.test(id)) ||
        new Set(ids).size !== ids.length
      )
        return serviceFailure('VALIDATION_ERROR', 'Invalid tag IDs', 400)
      const [rows] = await this.db.query<[{ tag_id: string }[]]>(
        'SELECT tag_id FROM tags WHERE tag_id IN $ids',
        { ids },
      )
      if (rows.length !== ids.length)
        return serviceFailure('VALIDATION_ERROR', 'One or more tags do not exist', 400)
      return success(undefined)
    })
  }
  async create(input: {
    name: string
    url: string
    tag_ids?: string[]
  }): Promise<ServiceResult<Website>> {
    return operation(async () => {
      const ids = input.tag_ids ?? []
      const validation = await this.validTags(ids)
      if (validation.code !== 0) return validation
      const now = new Date().toISOString()
      const id = crypto.randomUUID()
      const write = await attempt(() =>
        this.db.query(
          'BEGIN TRANSACTION; LET $found = (SELECT tag_id FROM tags WHERE tag_id IN $tag_ids); IF array::len($found) != array::len($tag_ids) { THROW "INVALID_TAG_IDS" }; CREATE websites CONTENT { website_id: $id, name: $name, url: $url, tag_ids: $tag_ids, search_text: $search_text, created_at: $now, updated_at: $now }; COMMIT TRANSACTION;',
          {
            id,
            name: input.name,
            url: input.url,
            tag_ids: ids,
            search_text: fold(input.name + ' ' + input.url),
            now,
          },
        ),
      )
      if (write.code !== 0) {
        if (write.error instanceof Error && write.error.message.includes('INVALID_TAG_IDS'))
          return serviceFailure('VALIDATION_ERROR', 'One or more tags do not exist', 400)
        const validation = await this.validTags(ids)
        if (validation.code !== 0) return validation
        return unexpectedFailure(write.error)
      }
      const rows = await this.orm.select('websites').where((site) => site.website_id.eq(id))
      return success((await this.hydrate(rows))[0]!)
    })
  }
  async update(
    id: string,
    input: { name?: string; url?: string; tag_ids?: string[] },
  ): Promise<ServiceResult<Website>> {
    return operation(async () => {
      if (input.tag_ids !== undefined) {
        const validation = await this.validTags(input.tag_ids)
        if (validation.code !== 0) return validation
      }
      const existing = await this.orm
        .select('websites')
        .where((site) => site.website_id.eq(id))
        .limit(1)
      if (!existing[0]) return serviceFailure('NOT_FOUND', 'Website not found', 404)
      const name = input.name ?? existing[0].name
      const url = input.url ?? existing[0].url
      const write = await attempt(() =>
        this.db.query(
          'BEGIN TRANSACTION; LET $found = (SELECT tag_id FROM tags WHERE tag_id IN $tag_ids); IF array::len($found) != array::len($tag_ids) { THROW "INVALID_TAG_IDS" }; UPDATE websites SET name = $name, url = $url, tag_ids = $tag_ids, search_text = $search_text, updated_at = $now WHERE website_id = $id; COMMIT TRANSACTION;',
          {
            id,
            name,
            url,
            tag_ids: input.tag_ids ?? existing[0].tag_ids ?? [],
            search_text: fold(name + ' ' + url),
            now: new Date().toISOString(),
          },
        ),
      )
      if (write.code !== 0) {
        if (write.error instanceof Error && write.error.message.includes('INVALID_TAG_IDS'))
          return serviceFailure('VALIDATION_ERROR', 'One or more tags do not exist', 400)
        const validation = await this.validTags(input.tag_ids ?? existing[0].tag_ids ?? [])
        if (validation.code !== 0) return validation
        return unexpectedFailure(write.error)
      }
      const rows = await this.orm.select('websites').where((site) => site.website_id.eq(id))
      if (!rows[0]) return serviceFailure('NOT_FOUND', 'Website not found', 404)
      return success((await this.hydrate(rows))[0]!)
    })
  }
}
