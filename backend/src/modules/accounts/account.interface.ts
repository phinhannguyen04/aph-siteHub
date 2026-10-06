export interface Account {
  id: string
  provider: string
  login_name: string
  external_account_id: string
  email: string
  password: string
  secret_key_encrypted: string
  is_limit: boolean
  created_at: Date
}

export type { AccountProviderStats, AccountStats } from './account-stats.interface'
