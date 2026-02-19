import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { withTimeout, TimeoutError } from '../withTimeout'

describe('withTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('TimeoutError', () => {
    it('should be an instance of Error with correct name and message', () => {
      const err = new TimeoutError(5000)
      expect(err).toBeInstanceOf(Error)
      expect(err).toBeInstanceOf(TimeoutError)
      expect(err.name).toBe('TimeoutError')
      expect(err.message).toBe('Operation timed out after 5000ms')
    })

    it('should include the timeout duration in the message', () => {
      expect(new TimeoutError(123).message).toBe('Operation timed out after 123ms')
      expect(new TimeoutError(0).message).toBe('Operation timed out after 0ms')
    })
  })

  describe('when promise resolves before timeout', () => {
    it('should return the resolved string value', async () => {
      const promise = new Promise<string>((resolve) => {
        setTimeout(() => resolve('success'), 100)
      })
      const resultPromise = withTimeout(promise, 5000)
      vi.advanceTimersByTime(100)
      await expect(resultPromise).resolves.toBe('success')
    })

    it('should return resolved object values', async () => {
      const data = { id: 1, name: 'test' }
      const promise = new Promise<typeof data>((resolve) => {
        setTimeout(() => resolve(data), 10)
      })
      const resultPromise = withTimeout(promise, 500)
      vi.advanceTimersByTime(10)
      await expect(resultPromise).resolves.toEqual(data)
    })

    it('should return immediately resolved promises', async () => {
      await expect(withTimeout(Promise.resolve('instant'), 1000)).resolves.toBe('instant')
    })
  })

  describe('when promise takes longer than timeout', () => {
    it('should reject with a TimeoutError', async () => {
      const neverResolves = new Promise<string>(() => {})
      const resultPromise = withTimeout(neverResolves, 3000)
      vi.advanceTimersByTime(3000)
      await expect(resultPromise).rejects.toThrow(TimeoutError)
      await expect(resultPromise).rejects.toThrow('Operation timed out after 3000ms')
    })

    it('should reject at exactly the timeout boundary', async () => {
      const slowPromise = new Promise<string>((resolve) => {
        setTimeout(() => resolve('too late'), 5001)
      })
      const resultPromise = withTimeout(slowPromise, 5000)
      vi.advanceTimersByTime(5000)
      await expect(resultPromise).rejects.toThrow(TimeoutError)
    })
  })

  describe('when promise rejects before timeout', () => {
    it('should propagate the original rejection error', async () => {
      const error = new Error('DB connection failed')
      const failingPromise = new Promise<string>((_, reject) => {
        setTimeout(() => reject(error), 50)
      })
      const resultPromise = withTimeout(failingPromise, 5000)
      vi.advanceTimersByTime(50)
      await expect(resultPromise).rejects.toBe(error)
    })

    it('should propagate immediately rejected promises', async () => {
      const error = new Error('immediate fail')
      await expect(withTimeout(Promise.reject(error), 5000)).rejects.toBe(error)
    })

    it('should not wrap rejection in TimeoutError', async () => {
      const failingPromise = new Promise<string>((_, reject) => {
        setTimeout(() => reject(new Error('early failure')), 100)
      })
      const resultPromise = withTimeout(failingPromise, 5000)
      vi.advanceTimersByTime(100)
      try {
        await resultPromise
      } catch (e) {
        expect(e).not.toBeInstanceOf(TimeoutError)
        expect(e).toBeInstanceOf(Error)
      }
    })

    it('should not swallow non-Error rejections', async () => {
      await expect(withTimeout(Promise.reject('string rejection'), 5000)).rejects.toBe('string rejection')
    })
  })

  describe('edge cases', () => {
    it('should handle promise resolving with undefined', async () => {
      await expect(withTimeout(Promise.resolve(undefined), 1000)).resolves.toBeUndefined()
    })

    it('should handle promise resolving with null', async () => {
      await expect(withTimeout(Promise.resolve(null), 1000)).resolves.toBeNull()
    })

    it('should handle promise resolving with false', async () => {
      await expect(withTimeout(Promise.resolve(false), 1000)).resolves.toBe(false)
    })

    it('should handle promise resolving with 0', async () => {
      await expect(withTimeout(Promise.resolve(0), 1000)).resolves.toBe(0)
    })

    it('should handle zero timeout - rejects if promise is async', async () => {
      const slowPromise = new Promise<string>((resolve) => {
        setTimeout(() => resolve('value'), 100)
      })
      const resultPromise = withTimeout(slowPromise, 0)
      vi.advanceTimersByTime(0)
      await expect(resultPromise).rejects.toThrow(TimeoutError)
    })

    it('should preserve generic types', async () => {
      interface User { id: string; name: string }
      const user: User = { id: '1', name: 'Alice' }
      const result = await withTimeout(Promise.resolve(user), 1000)
      expect(result.id).toBe('1')
      expect(result.name).toBe('Alice')
    })
  })
})
