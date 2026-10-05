import { resetAdminPassword } from '../modules/auth/password-reset'
import { runWithDatabase } from './run-with-database'

const result = await runWithDatabase(resetAdminPassword)
if (result.code !== 0) {
  console.error(result.error.cause ?? result.error.message)
  process.exitCode = result.code
} else {
  console.log(`New administrator password (shown once): ${result.data}`)
}
