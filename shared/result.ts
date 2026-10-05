/** Zero means success; failures carry a stable error code and details. */
export type Result<T, E> = { code: 0; data: T } | { code: 1; error: E }

export function success<T>(data: T): Result<T, never> {
  return { code: 0, data }
}

export function failure<E>(error: E): Result<never, E> {
  return { code: 1, error }
}

/** Adapter for libraries that reject promises or throw synchronously. */
export async function attempt<T>(operation: () => T | PromiseLike<T>): Promise<Result<T, unknown>> {
  return Promise.resolve().then(operation).then(success, failure)
}

/** Synchronous exception-only APIs (for example JSON.parse) need this boundary. */
export function attemptSync<T>(operation: () => T): Result<T, unknown> {
  try {
    return success(operation())
  } catch (error) {
    return failure(error)
  }
}
