import {
  attempt,
  serviceFailure,
  success,
  unexpectedFailure,
  type ServiceResult,
} from '../common/errors/result'

/**
 * Find PostgreSQL error codes and constraint names through nested driver errors without
 * following cycles.
 */
function postgresError(error: unknown): { code?: string; constraint_name?: string } | null {
  let current = error
  const seen = new Set<unknown>()
  while (typeof current === 'object' && current !== null && !seen.has(current)) {
    seen.add(current)

    if ('code' in current && typeof current.code === 'string') {
      return {
        code: current.code,
        constraint_name:
          'constraint_name' in current && typeof current.constraint_name === 'string'
            ? current.constraint_name
            : 'constraint' in current && typeof current.constraint === 'string'
              ? current.constraint
              : undefined,
      }
    }

    current =
      'driverError' in current ? current.driverError : 'cause' in current ? current.cause : null
  }

  return null
}

/** Convert driver errors at the database boundary; callers inspect return codes. */
export async function query<T>(operation: () => PromiseLike<T>): Promise<ServiceResult<T>> {
  const result = await attempt(operation)

  if (result.code === 0) {
    return success(result.data)
  }

  const error = postgresError(result.error)

  if (error?.code === '23505' && error.constraint_name === 'tags_name_key_unique') {
    return serviceFailure('CONFLICT', 'A tag with this name already exists', 409)
  }

  if (error?.code === '23505' && error.constraint_name === 'accounts_provider_external_id_unique') {
    return serviceFailure(
      'CONFLICT',
      'An account with this provider and external ID already exists',
      409,
    )
  }

  if (error?.code === '23503') {
    return serviceFailure('VALIDATION_ERROR', 'One or more tags do not exist', 400)
  }

  return unexpectedFailure(result.error)
}
