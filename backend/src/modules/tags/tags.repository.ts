import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { TagEntity } from './entities/tag.entity'
import { query } from '../../database/error'
import type { ServiceResult } from '../../common/errors/result'

@Injectable()
export class TagsRepository {
  /** Receive the TypeORM repository used to persist tags. */
  constructor(@InjectRepository(TagEntity) private readonly tags: Repository<TagEntity>) {}

  /** Read tags in ascending order of their normalized name keys. */
  list(): Promise<ServiceResult<TagEntity[]>> {
    return query(() => this.tags.find({ order: { nameKey: 'ASC' } }))
  }

  /** Insert the supplied tag record and return it after a successful write. */
  create(row: TagEntity): Promise<ServiceResult<TagEntity>> {
    return query(async () => {
      await this.tags.insert(row)

      return row
    })
  }

  /** Update and reload a tag in one transaction, returning null when its ID does not exist. */
  update(
    id: string,
    changes: Pick<TagEntity, 'name' | 'nameKey' | 'description' | 'color' | 'updated_at'>,
  ): Promise<ServiceResult<TagEntity | null>> {
    return query(() =>
      this.tags.manager.transaction(async (tx) => {
        const repo = tx.getRepository(TagEntity)
        const write = await repo.update(id, changes)

        if (!write.affected) {
          return null
        }

        return repo.findOneBy({ id })
      }),
    )
  }

  /** Delete a tag by ID and report whether the operation affected a record. */
  delete(id: string): Promise<ServiceResult<boolean>> {
    return query(async () => Boolean((await this.tags.delete(id)).affected))
  }
}
