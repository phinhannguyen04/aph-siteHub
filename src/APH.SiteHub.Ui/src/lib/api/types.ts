export type Tag = {
  id: string
  name: string
  description: string
  color: string
  created_at: string
  updated_at: string
}
export type Website = {
  id: string
  name: string
  url: string
  tag_ids: string[]
  tags: Tag[]
  created_at: string
  updated_at: string
}
export type WebsitePage = { websites: Website[]; total: number; page: number; pageSize: number }
export type Account = {
  id: string
  provider: string
  login_name: string
  external_account_id: string
  email: string
  is_limit: boolean
  created_at: string
}
export type ProviderStats = { provider: string; total: number; limited: number; unlimited: number }
export type AccountStats = {
  total: number
  limited: number
  unlimited: number
  providers: ProviderStats[]
}
export type ApiError = { code: string; message: string; status: number }
export type Result<T> = { ok: true; data: T } | { ok: false; error: ApiError }
