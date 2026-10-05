import type { Repository } from './repository'

export class TagsService {
  constructor(private readonly repository: Repository) {}
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
