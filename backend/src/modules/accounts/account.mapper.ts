import type { Account } from './account.interface'
import type { AccountEntity } from './entities/account.entity'

export function toAccount(row: AccountEntity): Account {
  return {
    id: row.id,
    provider: row.provider,
    login_name: row.login_name,
    external_account_id: row.external_account_id,
    email: row.email,
    is_limit: row.is_limit,
    created_at: row.created_at.toISOString(),
  }
}
