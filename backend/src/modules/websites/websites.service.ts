import { Injectable } from '@nestjs/common'
import { operation, serviceFailure, success, type ServiceResult } from '../../common/errors/result'
import type { Website } from './website.interface'
import type { ListQuery } from './list-query'
import { fold } from './search'
import { toWebsite } from './website.mapper'
import { WebsitesRepository } from './websites.repository'

export interface WebsitePage {
  websites: Website[]
  total: number
  page: number
  pageSize: number
}

/** Validate the tag-ID count, UUID-shaped values, and uniqueness before any database write. */
function validTags(ids: string[]) {
  return (
    ids.length <= 50 &&
    ids.every((id) => /^[0-9a-f-]{36}$/i.test(id)) &&
    new Set(ids).size === ids.length
  )
}

@Injectable()
export class WebsitesService {
  /** Receive the repository responsible for websites and their ordered tag associations. */
  constructor(private readonly websites: WebsitesRepository) {}

  /**
   * Map a repository page to public website responses while preserving totals and
   * pagination metadata.
   */
  async list(input: ListQuery): Promise<ServiceResult<WebsitePage>> {
    const result = await this.websites.list(input)

    if (result.code !== 0) {
      return result
    }

    return success({
      ...result.data,
      websites: result.data.websites.map(({ row, tags }) => toWebsite(row, tags)),
    })
  }

  /** Retrieve the total number of websites independently of search and tag filters. */
  count(): Promise<ServiceResult<number>> {
    return this.websites.count()
  }

  /**
   * Validate tag IDs, generate identity and timestamps, and persist a website with its
   * ordered tags.
   */
  create(input: {
    name: string
    url: string
    tag_ids?: string[]
  }): Promise<ServiceResult<Website>> {
    const ids = input.tag_ids ?? []

    if (!validTags(ids)) {
      return Promise.resolve(serviceFailure('VALIDATION_ERROR', 'Invalid tag IDs', 400))
    }

    return operation(async () => {
      const now = new Date().toISOString()
      const result = await this.websites.create(
        {
          id: crypto.randomUUID(),
          name: input.name,
          url: input.url,
          searchText: fold(input.name + ' ' + input.url),
          created_at: now,
          updated_at: now,
        },
        ids,
      )

      if (result.code !== 0) {
        return result
      }

      return success(toWebsite(result.data.row, result.data.tags))
    })
  }

  /**
   * Validate supplied tag IDs, update the website, and return a not-found failure when
   * its ID is absent.
   */
  async update(
    id: string,
    input: { name?: string; url?: string; tag_ids?: string[] },
  ): Promise<ServiceResult<Website>> {
    if (input.tag_ids !== undefined && !validTags(input.tag_ids)) {
      return serviceFailure('VALIDATION_ERROR', 'Invalid tag IDs', 400)
    }

    const result = await this.websites.update(id, input, new Date().toISOString())

    if (result.code !== 0) {
      return result
    }

    if (!result.data) {
      return serviceFailure('NOT_FOUND', 'Website not found', 404)
    }

    return success(toWebsite(result.data.row, result.data.tags))
  }
}
