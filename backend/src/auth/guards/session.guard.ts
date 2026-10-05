import { httpData } from '../../common/errors/result'
import { CanActivate, ExecutionContext, HttpException, Inject, Injectable } from '@nestjs/common'
import type { FastifyRequest } from 'fastify'
import type { AppConfig } from '../../config/app-config'
import { APP_CONFIG } from '../../config/config.tokens'
import { apiError } from '../../common/errors/api-error'
import { CredentialsService } from '../credentials.service'
import { getSession, sameOrigin, validCsrf } from '../session'

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    private readonly credentials: CredentialsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest>()
    const session = getSession(request, this.config.sessionSecret)
    const credential = session ? httpData(await this.credentials.current()) : null
    if (!session || !credential || session.version !== credential.version)
      throw new HttpException(apiError('UNAUTHORIZED', 'Please sign in'), 401)
    if (
      request.method !== 'GET' &&
      (!sameOrigin(request, this.config) || !validCsrf(request, session.csrf))
    )
      throw new HttpException(apiError('FORBIDDEN', 'Invalid session or request origin'), 403)
    return true
  }
}
