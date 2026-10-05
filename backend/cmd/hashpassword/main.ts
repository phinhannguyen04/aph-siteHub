const password = Bun.env.ADMIN_INITIAL_PASSWORD
if (!password || password.length < 12)
  throw new Error('Set ADMIN_INITIAL_PASSWORD to at least 12 characters')
const hash = await Bun.password.hash(password, { algorithm: 'argon2id' })
console.log(Buffer.from(hash).toString('base64'))

export {}
