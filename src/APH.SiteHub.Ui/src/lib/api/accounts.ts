import type { Account } from './types'
export type AccountInput = {
  provider: string
  login_name: string
  external_account_id: string
  email: string
  password: string
  secret_key: string
  is_limit: boolean
}
export function accountPatch(
  original: Account,
  input: Pick<AccountInput, 'password' | 'secret_key' | 'is_limit'>,
) {
  return {
    ...(input.password ? { password: input.password } : {}),
    ...(input.secret_key ? { secret_key: input.secret_key } : {}),
    ...(input.is_limit !== original.is_limit ? { is_limit: input.is_limit } : {}),
  }
}
