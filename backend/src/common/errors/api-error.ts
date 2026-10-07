/** Build the standard HTTP error body from a public error code and message. */
export function apiError(code: string, message: string) {
  return { error: { code, message } }
}
