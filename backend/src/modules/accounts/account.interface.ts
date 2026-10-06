export interface Account {
  id: string
  provider: string
  login_name: string
  external_account_id: string
  email: string
  is_limit: boolean
  created_at: string
}

export type { AccountProviderStats, AccountStats } from './account-stats.interface'
