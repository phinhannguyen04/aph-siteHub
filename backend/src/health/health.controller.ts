import { Controller, Get, HttpException, Inject } from '@nestjs/common'
import type { Surreal } from 'surrealdb'
import { DATABASE } from '../database/database.tokens'
import { apiError } from '../common/errors/api-error'

@Controller()
export class HealthController {
  constructor(@Inject(DATABASE) private readonly db: Surreal) {}
  @Get('health')
  async check() {
    try {
      await this.db.query('RETURN 1')
      return { status: 'ok' }
    } catch {
      throw new HttpException(
        apiError('DATABASE_UNAVAILABLE', 'Unable to connect to the database'),
        503,
      )
    }
  }
}
