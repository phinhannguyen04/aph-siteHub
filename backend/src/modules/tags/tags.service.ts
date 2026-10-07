import { Injectable } from '@nestjs/common'
import { operation, serviceFailure, success, type ServiceResult } from '../../common/errors/result'
import type { Tag } from './tag.interface'
import { toTag } from './tag.mapper'
import { TagsRepository } from './tags.repository'

@Injectable()
export class TagsService {
  /** Receive the repository used to store and retrieve tags. */
  constructor(private readonly tags: TagsRepository) {}

  /** Retrieve tags and map them to public response records. */
  async list(): Promise<ServiceResult<Tag[]>> {
    const result = await this.tags.list()

    if (result.code !== 0) {
      return result
    }

    return success(result.data.map(toTag))
  }

  /** Generate a tag ID and timestamps, derive its uniqueness key, and persist the tag. */
  create(input: { name: string; description: string; color: string }): Promise<ServiceResult<Tag>> {
    return operation(async () => {
      const now = new Date().toISOString()
      const result = await this.tags.create({
        id: crypto.randomUUID(),
        ...input,
        nameKey: input.name.toLocaleLowerCase('vi'),
        created_at: now,
        updated_at: now,
      })

      if (result.code !== 0) {
        return result
      }

      return success(toTag(result.data))
    })
  }

  /**
   * Refresh the tag uniqueness key and modification time, returning a not-found failure
   * for a missing ID.
   */
  async update(
    id: string,
    input: { name: string; description: string; color: string },
  ): Promise<ServiceResult<Tag>> {
    const result = await this.tags.update(id, {
      ...input,
      nameKey: input.name.toLocaleLowerCase('vi'),
      updated_at: new Date().toISOString(),
    })

    if (result.code !== 0) {
      return result
    }

    if (!result.data) {
      return serviceFailure('NOT_FOUND', 'Tag not found', 404)
    }

    return success(toTag(result.data))
  }

  /** Delete a tag and distinguish a missing record from a successful deletion. */
  async delete(id: string): Promise<ServiceResult<void>> {
    const result = await this.tags.delete(id)

    if (result.code !== 0) {
      return result
    }

    if (!result.data) {
      return serviceFailure('NOT_FOUND', 'Tag not found', 404)
    }

    return success(undefined)
  }
}
