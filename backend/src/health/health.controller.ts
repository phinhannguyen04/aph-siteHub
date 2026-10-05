import { Controller, Get, Inject } from '@nestjs/common'
import type { Database } from '../database/client'
import { DATABASE } from '../database/database.tokens'
import { attempt, httpData, serviceFailure } from '../common/errors/result'

@Controller()
export class HealthController {
  constructor(@Inject(DATABASE) private readonly db: Database) {}
  @Get('health')
  async check() {
    const result = await attempt(() => this.db.query('SELECT 1'))
    if (result.code !== 0)
      return httpData(
        serviceFailure('DATABASE_UNAVAILABLE', 'Unable to connect to the database', 503),
      )
    return { status: 'ok' }
  }
}
