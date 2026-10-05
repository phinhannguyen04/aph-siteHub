import { resetAdminPassword } from '../../internal/auth/reset'
import { newRepository } from '../../internal/auth/repository'
import { runWithDatabase } from '../../internal/database/command'

const result = await runWithDatabase((db) => resetAdminPassword(newRepository(db)))
if (result.code !== 0) {
  console.error(result.error.cause ?? result.error.message)
  process.exitCode = result.code
} else {
  console.log(`New administrator password (shown once): ${result.data}`)
}
