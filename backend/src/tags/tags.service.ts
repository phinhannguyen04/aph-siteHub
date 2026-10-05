import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { TagEntity } from './entities/tag.entity'
import { query } from '../database/error'
import { operation, serviceFailure, success, type ServiceResult } from '../common/errors/result'
import { toTag, type Tag } from './tag.interface'

@Injectable()
export class TagsService {
  constructor(@InjectRepository(TagEntity) private readonly tags: Repository<TagEntity>) {}
  list(): Promise<ServiceResult<Tag[]>> {
    return query(async () => (await this.tags.find({ order: { nameKey: 'ASC' } })).map(toTag))
  }
  create(input: { name: string; description: string; color: string }): Promise<ServiceResult<Tag>> {
    return operation(async () => {
      const now = new Date().toISOString()
      const tag = { id: crypto.randomUUID(), ...input, created_at: now, updated_at: now }
      const write = await query(() =>
        this.tags.insert({ ...tag, nameKey: input.name.toLocaleLowerCase('vi') }),
      )
      if (write.code !== 0) return write
      return success(tag)
    })
  }
  async update(
    id: string,
    input: { name: string; description: string; color: string },
  ): Promise<ServiceResult<Tag>> {
    const result = await query(() =>
      this.tags.manager.transaction(async (tx) => {
        const repo = tx.getRepository(TagEntity)
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
  }
  async delete(id: string): Promise<ServiceResult<void>> {
    const result = await query(() => this.tags.delete(id))
    if (result.code !== 0) return result
    if (!result.data.affected) return serviceFailure('NOT_FOUND', 'Tag not found', 404)
    return success(undefined)
  }
}
