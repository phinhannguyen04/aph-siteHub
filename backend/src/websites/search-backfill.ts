import { eq } from 'drizzle-orm'
import type { Database } from '../database/client'
import { websites } from '../database/schema'
import { fold } from './search'
export async function backfillWebsiteSearch(db: Database): Promise<void> {
  await db.transaction(async (tx) => {
    for (const website of await tx.select().from(websites).for('update')) {
      const searchText = fold(website.name + ' ' + website.url)
      if (website.searchText !== searchText)
        await tx.update(websites).set({ searchText }).where(eq(websites.id, website.id))
    }
  })
}
