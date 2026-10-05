import { serviceFailure } from '../result/result'
import type { Repository } from './repository'
import type { ListQuery } from './query'
import { fold } from './search'

function validTags(ids: string[]) {
  return (
    ids.length <= 50 &&
    ids.every((id) => /^[0-9a-f-]{36}$/i.test(id)) &&
    new Set(ids).size === ids.length
  )
}

export class WebsitesService {
  constructor(private readonly repository: Repository) {}
  list(input: ListQuery) {
    return this.repository.list(input)
  }
  count() {
    return this.repository.count()
  }
  create(input: { name: string; url: string; tag_ids?: string[] }) {
    const ids = input.tag_ids ?? []
    if (!validTags(ids))
      return Promise.resolve(serviceFailure('VALIDATION_ERROR', 'Invalid tag IDs', 400))
    const now = new Date().toISOString()
    return this.repository.create({
      id: crypto.randomUUID(),
      name: input.name,
      url: input.url,
      tag_ids: ids,
      searchText: fold(input.name + ' ' + input.url),
      created_at: now,
      updated_at: now,
    })
  }
  update(id: string, input: { name?: string; url?: string; tag_ids?: string[] }) {
    if (input.tag_ids !== undefined && !validTags(input.tag_ids))
      return Promise.resolve(serviceFailure('VALIDATION_ERROR', 'Invalid tag IDs', 400))
    return this.repository.update(id, input)
  }
}
