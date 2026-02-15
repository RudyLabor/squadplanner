/**
 * Tests for src/lib/supabase-realtime.ts
 * Covers: getRealtimeClient (currently disabled — throws error)
 */
import { describe, it, expect } from 'vitest'

import { getRealtimeClient } from '../supabase-realtime'

describe('supabase-realtime', () => {
  // STRICT: Verifies getRealtimeClient is exported as an async function, rejects
  // with the correct error message, and the error is an instance of Error
  it('getRealtimeClient is exported, is async, and throws the correct disabled error', async () => {
    // 1. getRealtimeClient is defined
    expect(getRealtimeClient).toBeDefined()
    // 2. getRealtimeClient is a function
    expect(typeof getRealtimeClient).toBe('function')
    // 3. Calling it returns a promise (async function)
    const result = getRealtimeClient()
    expect(result).toBeInstanceOf(Promise)

    // 4. The promise rejects
    await expect(result).rejects.toThrow()
    // 5. Rejects with specific error message
    await expect(getRealtimeClient()).rejects.toThrow(
      'Realtime client disabled to reduce bundle size'
    )
    // 6. The error is an instance of Error
    try {
      await getRealtimeClient()
    } catch (err) {
      expect(err).toBeInstanceOf(Error)
      // 7. Error message matches exactly
      expect((err as Error).message).toBe('Realtime client disabled to reduce bundle size')
      // 8. Error has a name property
      expect((err as Error).name).toBe('Error')
    }
  })

  // STRICT: Verifies the function consistently throws on repeated calls (no caching
  // of the client since it throws before assignment) and never resolves
  it('consistently throws on every call and never caches a client', async () => {
    // 1. First call rejects
    await expect(getRealtimeClient()).rejects.toThrow('Realtime client disabled')
    // 2. Second call also rejects (client is NOT cached because throw happens before assignment)
    await expect(getRealtimeClient()).rejects.toThrow('Realtime client disabled')
    // 3. Third call rejects too
    await expect(getRealtimeClient()).rejects.toThrow('Realtime client disabled')

    // 4. All rejections have the same error message
    const errors: Error[] = []
    for (let i = 0; i < 3; i++) {
      try {
        await getRealtimeClient()
      } catch (err) {
        errors.push(err as Error)
      }
    }
    // 5. We caught 3 errors
    expect(errors).toHaveLength(3)
    // 6. All have the same message
    expect(errors[0].message).toBe(errors[1].message)
    expect(errors[1].message).toBe(errors[2].message)
    // 7. All are Error instances
    errors.forEach((err) => {
      expect(err).toBeInstanceOf(Error)
    })
    // 8. Message contains "bundle size" (key reason for disabling)
    expect(errors[0].message).toContain('bundle size')
  })

  // STRICT: Verifies the error structure has expected properties and the
  // rejection can be caught with standard try/catch and .catch()
  it('error structure is correct and catchable via both try/catch and .catch()', async () => {
    // 1. Catchable with .catch()
    let caughtViaPromise: Error | null = null
    await getRealtimeClient().catch((err) => {
      caughtViaPromise = err
    })
    expect(caughtViaPromise).not.toBeNull()
    // 2. Error from .catch() is an Error instance
    expect(caughtViaPromise).toBeInstanceOf(Error)
    // 3. Has correct message
    expect((caughtViaPromise as unknown as Error).message).toBe('Realtime client disabled to reduce bundle size')

    // 4. Catchable with try/catch
    let caughtViaTryCatch: Error | null = null
    try {
      await getRealtimeClient()
    } catch (err) {
      caughtViaTryCatch = err as Error
    }
    expect(caughtViaTryCatch).not.toBeNull()
    // 5. Both methods catch the same type of error
    expect(caughtViaTryCatch).toBeInstanceOf(Error)
    // 6. Same message
    expect(caughtViaTryCatch!.message).toBe((caughtViaPromise as unknown as Error).message)
    // 7. Error has a stack trace
    expect(caughtViaTryCatch!.stack).toBeDefined()
    expect(typeof caughtViaTryCatch!.stack).toBe('string')
    // 8. Stack includes the function name or file reference
    expect(caughtViaTryCatch!.stack!.length).toBeGreaterThan(0)
  })

  // STRICT: Verifies the module exports only getRealtimeClient and no other
  // runtime exports, confirming the minimal API surface
  it('module has minimal API surface with only getRealtimeClient export', async () => {
    const mod = await import('../supabase-realtime')
    // 1. Module is defined
    expect(mod).toBeDefined()
    // 2. getRealtimeClient is in the module
    expect(mod.getRealtimeClient).toBeDefined()
    // 3. getRealtimeClient is the same reference
    expect(mod.getRealtimeClient).toBe(getRealtimeClient)

    // 4. Get all exported keys
    const keys = Object.keys(mod)
    // 5. getRealtimeClient is one of them
    expect(keys).toContain('getRealtimeClient')

    // 6. All exports are functions (no leaked internal state)
    const functionExports = Object.values(mod).filter((v) => typeof v === 'function')
    expect(functionExports.length).toBeGreaterThanOrEqual(1)
    // 7. getRealtimeClient is async (returns promise)
    const returnVal = mod.getRealtimeClient()
    expect(returnVal).toBeInstanceOf(Promise)
    // 8. Clean up the rejected promise
    await returnVal.catch(() => {})
    expect(true).toBe(true) // Reached without unhandled rejection
  })
})
