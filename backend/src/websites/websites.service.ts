import { Inject, Injectable } from '@nestjs/common'
import type { Surreal } from 'surrealdb'
import { DATABASE } from '../database/database.tokens'

import type { Website } from './website.interface'

type WebsiteRecord = Omit<Website, 'id'> & { website_id: string }

function toWebsite(record: WebsiteRecord): Website {
  return {
    id: record.website_id,
    name: record.name,
    url: record.url,
    created_at: record.created_at,
    updated_at: record.updated_at,
  }
}

@Injectable()
export class WebsitesService {
  constructor(@Inject(DATABASE) private readonly db: Surreal) {}
  async list(): Promise<Website[]> {
    const [records] = await this.db.query<[WebsiteRecord[]]>(
      'SELECT website_id, name, url, created_at, updated_at FROM websites ORDER BY created_at DESC, website_id DESC',
    )
    return records.map(toWebsite)
  }
  async count(): Promise<number> {
    const [records] = await this.db.query<[{ total: number }[]]>(
      'SELECT count() AS total FROM websites GROUP ALL',
    )
    return Number(records[0]?.total ?? 0)
  }
  async create(input: { name: string; url: string }): Promise<Website> {
    const now = new Date().toISOString()
    const website: Website = {
      id: crypto.randomUUID(),
      ...input,
      created_at: now,
      updated_at: now,
    }
    await this.db.query(
      'CREATE websites CONTENT { website_id: $website_id, name: $name, url: $url, created_at: $created_at, updated_at: $updated_at }',
      { website_id: website.id, ...input, created_at: now, updated_at: now },
    )
    return website
  }
  async update(id: string, input: { name?: string; url?: string }): Promise<Website | null> {
    const setFields: string[] = ['updated_at = $updated_at']
    if (input.name !== undefined) setFields.push('name = $name')
    if (input.url !== undefined) setFields.push('url = $url')
    const [records] = await this.db.query<[WebsiteRecord[]]>(
      `UPDATE websites SET ${setFields.join(', ')} WHERE website_id = $website_id RETURN AFTER`,
      { website_id: id, updated_at: new Date().toISOString(), ...input },
    )
    return records[0] ? toWebsite(records[0]) : null
  }
}
