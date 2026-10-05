import { Controller, Get, Inject } from '@nestjs/common'
import type { Surreal } from 'surrealdb'
import { DATABASE } from '../database/database.tokens'
import { attempt, httpData, serviceFailure } from '../common/errors/result'

@Controller()
export class HealthController {
  constructor(@Inject(DATABASE) private readonly db: Surreal) {}
  @Get('health')
  async check() {
    const result = await attempt(() => this.db.query('RETURN 1'))
    if (result.code !== 0)
      return httpData(
        serviceFailure('DATABASE_UNAVAILABLE', 'Unable to connect to the database', 503),
      )
    return { status: 'ok' }
  }
}
