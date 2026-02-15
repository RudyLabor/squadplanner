import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// We need to test both dev and prod modes, so we'll test with dynamic imports
// and mock import.meta.env.PROD

describe('logger', () => {
  let consoleSpy: {
    log: ReturnType<typeof vi.spyOn>
    info: ReturnType<typeof vi.spyOn>
    warn: ReturnType<typeof vi.spyOn>
    error: ReturnType<typeof vi.spyOn>
    debug: ReturnType<typeof vi.spyOn>
  }

  beforeEach(() => {
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('createLogger', () => {
    it('creates a logger with all five log methods', async () => {
      const { createLogger } = await import('../logger')
      const log = createLogger('[Test]')
      expect(typeof log.log).toBe('function')
      expect(typeof log.info).toBe('function')
      expect(typeof log.warn).toBe('function')
      expect(typeof log.error).toBe('function')
      expect(typeof log.debug).toBe('function')
    })

    it('error always logs regardless of environment', async () => {
      const { createLogger } = await import('../logger')
      const log = createLogger('[Critical]')
      log.error('something failed', { code: 500 })
      expect(consoleSpy.error).toHaveBeenCalledWith('[Critical]', 'something failed', { code: 500 })
    })

    it('error logs with namespace prefix', async () => {
      const { createLogger } = await import('../logger')
      const log = createLogger('[Auth]')
      log.error('session expired')
      expect(consoleSpy.error).toHaveBeenCalledWith('[Auth]', 'session expired')
    })

    it('log method outputs to console.log with namespace', async () => {
      const { createLogger } = await import('../logger')
      const log = createLogger('[MyModule]')
      log.log('hello', 42)
      // In test environment (not PROD), non-error logs should output
      // isDev = !import.meta.env.PROD — in vitest, PROD is false so isDev is true
      expect(consoleSpy.log).toHaveBeenCalledWith('[MyModule]', 'hello', 42)
    })

    it('info method outputs to console.info with namespace', async () => {
      const { createLogger } = await import('../logger')
      const log = createLogger('[Info]')
      log.info('data loaded')
      expect(consoleSpy.info).toHaveBeenCalledWith('[Info]', 'data loaded')
    })

    it('warn method outputs to console.warn with namespace', async () => {
      const { createLogger } = await import('../logger')
      const log = createLogger('[Warn]')
      log.warn('deprecated usage')
      expect(consoleSpy.warn).toHaveBeenCalledWith('[Warn]', 'deprecated usage')
    })

    it('debug method outputs to console.debug with namespace', async () => {
      const { createLogger } = await import('../logger')
      const log = createLogger('[Debug]')
      log.debug('verbose info', { key: 'val' })
      expect(consoleSpy.debug).toHaveBeenCalledWith('[Debug]', 'verbose info', { key: 'val' })
    })

    it('handles multiple arguments', async () => {
      const { createLogger } = await import('../logger')
      const log = createLogger('[Multi]')
      log.log('a', 'b', 'c', 1, 2, 3)
      expect(consoleSpy.log).toHaveBeenCalledWith('[Multi]', 'a', 'b', 'c', 1, 2, 3)
    })

    it('handles no arguments', async () => {
      const { createLogger } = await import('../logger')
      const log = createLogger('[Empty]')
      log.log()
      expect(consoleSpy.log).toHaveBeenCalledWith('[Empty]')
    })
  })

  describe('pre-built loggers', () => {
    it('exports a global logger with [App] namespace', async () => {
      const { logger } = await import('../logger')
      logger.error('test')
      expect(consoleSpy.error).toHaveBeenCalledWith('[App]', 'test')
    })

    it('exports voiceCallLogger with [VoiceCall] namespace', async () => {
      const { voiceCallLogger } = await import('../logger')
      voiceCallLogger.error('call failed')
      expect(consoleSpy.error).toHaveBeenCalledWith('[VoiceCall]', 'call failed')
    })

    it('exports voiceChatLogger with [VoiceChat] namespace', async () => {
      const { voiceChatLogger } = await import('../logger')
      voiceChatLogger.error('chat error')
      expect(consoleSpy.error).toHaveBeenCalledWith('[VoiceChat]', 'chat error')
    })

    it('exports pushLogger with [Push] namespace', async () => {
      const { pushLogger } = await import('../logger')
      pushLogger.error('push error')
      expect(consoleSpy.error).toHaveBeenCalledWith('[Push]', 'push error')
    })

    it('exports authLogger with [Auth] namespace', async () => {
      const { authLogger } = await import('../logger')
      authLogger.error('auth error')
      expect(consoleSpy.error).toHaveBeenCalledWith('[Auth]', 'auth error')
    })

    it('exports networkLogger with [Network] namespace', async () => {
      const { networkLogger } = await import('../logger')
      networkLogger.error('network error')
      expect(consoleSpy.error).toHaveBeenCalledWith('[Network]', 'network error')
    })

    it('exports aiLogger with [AI] namespace', async () => {
      const { aiLogger } = await import('../logger')
      aiLogger.error('ai error')
      expect(consoleSpy.error).toHaveBeenCalledWith('[AI]', 'ai error')
    })

    it('exports messagesLogger with [Messages] namespace', async () => {
      const { messagesLogger } = await import('../logger')
      messagesLogger.error('msg error')
      expect(consoleSpy.error).toHaveBeenCalledWith('[Messages]', 'msg error')
    })

    it('exports sessionsLogger with [Sessions] namespace', async () => {
      const { sessionsLogger } = await import('../logger')
      sessionsLogger.error('session error')
      expect(consoleSpy.error).toHaveBeenCalledWith('[Sessions]', 'session error')
    })

    it('exports subscriptionLogger with [Subscription] namespace', async () => {
      const { subscriptionLogger } = await import('../logger')
      subscriptionLogger.error('sub error')
      expect(consoleSpy.error).toHaveBeenCalledWith('[Subscription]', 'sub error')
    })

    it('exports presenceLogger with [Presence] namespace', async () => {
      const { presenceLogger } = await import('../logger')
      presenceLogger.error('presence error')
      expect(consoleSpy.error).toHaveBeenCalledWith('[Presence]', 'presence error')
    })

    it('exports squadsLogger with [Squads] namespace', async () => {
      const { squadsLogger } = await import('../logger')
      squadsLogger.error('squads error')
      expect(consoleSpy.error).toHaveBeenCalledWith('[Squads]', 'squads error')
    })
  })

  describe('devLog', () => {
    it('logs with [Dev] prefix in non-prod environment', async () => {
      const { devLog } = await import('../logger')
      devLog('hello', { data: 1 })
      expect(consoleSpy.log).toHaveBeenCalledWith('[Dev]', 'hello', { data: 1 })
    })

    it('handles no arguments', async () => {
      const { devLog } = await import('../logger')
      devLog()
      expect(consoleSpy.log).toHaveBeenCalledWith('[Dev]')
    })
  })

  describe('silentCatch', () => {
    it('logs warning in dev mode and returns undefined', async () => {
      const { silentCatch } = await import('../logger')
      const result = silentCatch(new Error('test error'))
      expect(consoleSpy.warn).toHaveBeenCalledWith('[SilentCatch]', expect.any(Error))
      expect(result).toBeUndefined()
    })

    it('returns undefined for string error', async () => {
      const { silentCatch } = await import('../logger')
      const result = silentCatch('string error')
      expect(result).toBeUndefined()
      expect(consoleSpy.warn).toHaveBeenCalledWith('[SilentCatch]', 'string error')
    })

    it('returns undefined for null error', async () => {
      const { silentCatch } = await import('../logger')
      const result = silentCatch(null)
      expect(result).toBeUndefined()
    })

    it('can be used as a catch handler', async () => {
      const { silentCatch } = await import('../logger')
      const result = await Promise.reject(new Error('fail')).catch(silentCatch)
      expect(result).toBeUndefined()
    })
  })
})
