/**
 * Wraps a promise with a timeout. If the promise doesn't resolve within
 * the given delay, it rejects with a TimeoutError.
 *
 * Used as a safety net around Supabase calls in clientLoaders to prevent
 * indefinite hangs caused by navigator.locks deadlocks or network issues.
 */
export class TimeoutError extends Error {
  constructor(ms: number) {
    super(`Operation timed out after ${ms}ms`)
    this.name = 'TimeoutError'
  }
}

export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new TimeoutError(ms)), ms)
    }),
  ])
}
