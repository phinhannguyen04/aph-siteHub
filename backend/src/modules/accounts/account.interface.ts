export interface Account {
  id: string
  provider: string
  name: string
  external_account_id: string
  email: string
  secret_key_encrypted: string
  is_limit: boolean
  created_at: string
}
