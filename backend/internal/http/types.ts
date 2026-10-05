export interface AppEnv {
  Bindings: { server?: Pick<Bun.Server<undefined>, 'requestIP'> }
  Variables: {
    session: { csrf: string; version: string }
    credential: { password_hash: string; version: string }
  }
}
