import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common'
import type { FastifyReply } from 'fastify'
import { ValidationError } from '../errors/validation-error'
import { apiError } from '../errors/api-error'

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const reply = host.switchToHttp().getResponse<FastifyReply>()
    if (exception instanceof ValidationError) {
      return reply.status(400).send(apiError('VALIDATION_ERROR', exception.message))
    }
    if (exception instanceof HttpException) {
      const status = exception.getStatus()
      const response = exception.getResponse()
      if (typeof response === 'object' && response !== null && 'error' in response) {
        return reply.status(status).send(response)
      }
      const code = status === 404 ? 'NOT_FOUND' : status === 400 ? 'VALIDATION_ERROR' : 'HTTP_ERROR'
      return reply.status(status).send(apiError(code, exception.message))
    }
    console.error(exception)
    return reply
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .send(apiError('INTERNAL_ERROR', 'Internal server error'))
  }
}
