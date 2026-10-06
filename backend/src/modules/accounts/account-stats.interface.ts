export interface AccountProviderStats {
  provider: string
  total: number
  limited: number
  unlimited: number
}

export interface AccountStats {
  total: number
  limited: number
  unlimited: number
  providers: AccountProviderStats[]
}
