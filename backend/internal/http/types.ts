import type { JwtVariables } from 'hono/jwt'

export interface AppEnv {
  Bindings: { server?: Pick<Bun.Server<undefined>, 'requestIP'> }
  Variables: JwtVariables & {
    session: { csrf: string; version: string }
    credential: { password_hash: string; version: string }
  }
}
