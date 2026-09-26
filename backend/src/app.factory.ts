import 'reflect-metadata'
import { HttpException, ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import type { Surreal } from 'surrealdb'
import { AppModule } from './app.module'
import { ApiExceptionFilter } from './common/filters/api-exception.filter'
import { apiError } from './common/errors/api-error'
import type { AppConfig } from './config/app-config'

interface AppOptions {
  database?: Surreal
  logger?: boolean
}

export async function createApp(
  config: AppConfig,
  options: AppOptions = {},
): Promise<NestFastifyApplication> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule.forRoot(config, options.database),
    new FastifyAdapter(),
    { logger: options.logger === false ? false : ['error', 'warn', 'log'] },
  )
  app.enableCors({ origin: [config.appOrigin, ...(config.appOrigins || [])], credentials: true })
  app.useGlobalFilters(new ApiExceptionFilter())
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      stopAtFirstError: true,
      exceptionFactory: (errors) => {
        const message = Object.values(errors[0]?.constraints ?? {})[0] ?? 'Invalid input'
        return new HttpException(apiError('VALIDATION_ERROR', message), 400)
      },
    }),
  )
  try {
    await app.init()
    return app
  } catch (error) {
    await app.close()
    throw error
  }
}
