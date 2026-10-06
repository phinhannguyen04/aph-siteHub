import type { AccountEntity } from './entities/account.entity'

/** Public account fields; credentials are excluded from API responses. */
export type AccountResponse = Pick<
  AccountEntity,
  'id' | 'provider' | 'login_name' | 'external_account_id' | 'email' | 'is_limit' | 'created_at'
>
