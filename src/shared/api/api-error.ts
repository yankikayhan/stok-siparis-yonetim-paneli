export class ApiError extends Error {
  readonly status: number | undefined
  readonly cause: unknown

  constructor(message: string, status?: number, cause?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.cause = cause
  }
}