import { operation, success, type ServiceResult } from '../common/errors/result'
import type { Database } from '../database/client'
import { websites } from '../database/schema'
import { fold } from './search'
export async function backfillWebsiteSearch(db: Database): Promise<ServiceResult<void>> {
  return operation(async () => {
    await db.transaction(async (tx) => {
      for (const website of await tx
        .getRepository(websites)
        .createQueryBuilder('site')
        .setLock('pessimistic_write')
        .getMany()) {
        const searchText = fold(website.name + ' ' + website.url)
        if (website.searchText !== searchText)
          await tx.getRepository(websites).update(website.id, { searchText })
      }
    })
    return success(undefined)
  })
}
