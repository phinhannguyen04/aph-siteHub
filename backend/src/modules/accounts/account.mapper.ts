import type { AccountResponse } from './account-response.interface'
import type { AccountEntity } from './entities/account.entity'

/**
 * Select public account fields for API responses, excluding the password and encrypted
 * secret key.
 */
export function toAccount(row: AccountEntity): AccountResponse {
  return {
    id: row.id,
    provider: row.provider,
    login_name: row.login_name,
    external_account_id: row.external_account_id,
    email: row.email,
    is_limit: row.is_limit,
    created_at: row.created_at,
  }
}
