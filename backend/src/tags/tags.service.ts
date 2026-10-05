import { Inject, Injectable } from '@nestjs/common'
import { DATABASE } from '../database/database.tokens'
import type { Database } from '../database/client'
import { newRepository } from './repository'
import type { Repository } from './repository'

@Injectable()
export class TagsService {
  private readonly repository: Repository
  constructor(@Inject(DATABASE) db: Database) {
    this.repository = newRepository(db)
  }
  list() {
    return this.repository.list()
  }
  create(input: { name: string; description: string; color: string }) {
    const now = new Date().toISOString()
    return this.repository.create({
      id: crypto.randomUUID(),
      ...input,
      created_at: now,
      updated_at: now,
    })
  }
  update(id: string, input: { name: string; description: string; color: string }) {
    return this.repository.update(id, input)
  }
  delete(id: string) {
    return this.repository.delete(id)
  }
}
