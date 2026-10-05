import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { TagEntity } from './entities/tag.entity'
import { query } from '../../database/error'
import type { ServiceResult } from '../../common/errors/result'

@Injectable()
export class TagsRepository {
  constructor(@InjectRepository(TagEntity) private readonly tags: Repository<TagEntity>) {}

  list(): Promise<ServiceResult<TagEntity[]>> {
    return query(() => this.tags.find({ order: { nameKey: 'ASC' } }))
  }

  create(row: TagEntity): Promise<ServiceResult<TagEntity>> {
    return query(async () => {
      await this.tags.insert(row)
      return row
    })
  }

  update(
    id: string,
    changes: Pick<TagEntity, 'name' | 'nameKey' | 'description' | 'color' | 'updated_at'>,
  ): Promise<ServiceResult<TagEntity | null>> {
    return query(() =>
      this.tags.manager.transaction(async (tx) => {
        const repo = tx.getRepository(TagEntity)
        const write = await repo.update(id, changes)
        if (!write.affected) return null
        return repo.findOneBy({ id })
      }),
    )
  }

  delete(id: string): Promise<ServiceResult<boolean>> {
    return query(async () => Boolean((await this.tags.delete(id)).affected))
  }
}
