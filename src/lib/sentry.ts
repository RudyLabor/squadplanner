/**
 * Backwards-compatibility shim — re-exports from errorTracker.ts
 * All consumers that import from './sentry' continue to work.
 */

export {
  initErrorTracker as initSentry,
  captureException,
  captureMessage,
  setUser,
  addBreadcrumb,
  startTransaction,
} from './errorTracker'
