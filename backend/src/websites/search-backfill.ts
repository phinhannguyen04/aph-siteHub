import type { Surreal } from 'surrealdb'
import { fold } from './search'
export async function backfillWebsiteSearch(db: Surreal): Promise<void> {
  const [websites] = await db.query<
    [{ website_id: string; name: string; url: string; search_text?: string }[]]
  >('SELECT website_id, name, url, search_text FROM websites')
  for (const website of websites) {
    const searchText = fold(website.name + ' ' + website.url)
    if (website.search_text !== searchText)
      await db.query('UPDATE websites SET search_text = $searchText WHERE website_id = $id', {
        searchText,
        id: website.website_id,
      })
  }
}
