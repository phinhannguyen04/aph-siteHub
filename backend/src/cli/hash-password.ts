import { operation, serviceFailure, success, type ServiceResult } from '../common/errors/result'
async function hashPassword(): Promise<ServiceResult<string>> {
  const password = Bun.env.ADMIN_INITIAL_PASSWORD
  if (!password || password.length < 12)
    return serviceFailure(
      'CONFIGURATION_ERROR',
      'Set ADMIN_INITIAL_PASSWORD to at least 12 characters',
      500,
    )
  return operation(async () => {
    const hash = await Bun.password.hash(password, { algorithm: 'argon2id' })
    return success(Buffer.from(hash).toString('base64'))
  })
}
const result = await hashPassword()
if (result.code !== 0) {
  console.error(result.error.cause ?? result.error.message)
  process.exitCode = result.code
} else {
  console.log(result.data)
}
