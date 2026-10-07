import { httpData, serviceFailure } from '../../common/errors/result'
import { Body, Controller, Get, HttpCode, Inject, Post, Req, Res, UseGuards } from '@nestjs/common'
import type { FastifyReply, FastifyRequest } from 'fastify'
import type { AppConfig } from '../../config/app.config'
import { APP_CONFIG } from '../../config/config.tokens'
import { LoginDto } from './dto/login.dto'
import { ChangePasswordDto } from './dto/change-password.dto'
import { SessionGuard } from './guards/session.guard'
import { clearSessionCookie, createSession, getSession, sameOrigin, sessionCookie } from './session'
import { createLoginLimiter } from './login-limiter'
import { CredentialsService, verifyAdminPassword } from './credentials.service'

@Controller('api/auth')
export class AuthController {
  private readonly limiter = createLoginLimiter()
  constructor(
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    private readonly credentials: CredentialsService,
  ) {}

  @Get('session')
  @UseGuards(SessionGuard)
  session(@Req() request: FastifyRequest) {
    return { csrfToken: getSession(request, this.config.sessionSecret)!.csrf }
  }

  @Post('login')
  @HttpCode(200)
  async login(
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
    @Body() body: LoginDto,
  ) {
    if (!sameOrigin(request, this.config)) {
      return httpData(serviceFailure('FORBIDDEN', 'Invalid request origin', 403))
    }

    const key =
      typeof request.headers['x-real-ip'] === 'string' ? request.headers['x-real-ip'] : request.ip

    if (this.limiter.isBlocked(key)) {
      return httpData(serviceFailure('RATE_LIMITED', 'Please try again in 15 minutes', 429))
    }

    const password = body.password
    const credential = httpData(await this.credentials.current())
    if (!httpData(await verifyAdminPassword(password, credential.password_hash))) {
      this.limiter.recordFailure(key)
      return httpData(serviceFailure('UNAUTHORIZED', 'Incorrect password', 401))
    }
    this.limiter.reset(key)
    const session = httpData(createSession(
      this.config.sessionSecret, 
      credential.version
    ))
    reply.header('set-cookie', sessionCookie(session.token, this.config))
    return { csrfToken: session.csrf }
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(SessionGuard)
  logout(@Res({ passthrough: true }) reply: FastifyReply) {
    reply.header('set-cookie', clearSessionCookie(this.config))
    return { ok: true }
  }

  @Post('change-password')
  @HttpCode(200)
  @UseGuards(SessionGuard)
  async changePassword(
    @Body() input: ChangePasswordDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    httpData(input.assertDifferent())
    const credential = httpData(await this.credentials.current())
    if (!httpData(await verifyAdminPassword(input.currentPassword, credential.password_hash)))
      return httpData(serviceFailure('UNAUTHORIZED', 'Incorrect current password', 401))
    const updated = httpData(await this.credentials.replace(input.newPassword, credential.version))
    if (!updated)
      return httpData(serviceFailure('CONFLICT', 'The password was changed. Please try again', 409))
    const session = httpData(createSession(this.config.sessionSecret, updated.version))
    reply.header('set-cookie', sessionCookie(session.token, this.config))
    return { csrfToken: session.csrf }
  }
}
