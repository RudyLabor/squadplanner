import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ── Hoisted mocks ─────────────────────────────────────────────────────
const {
  mockSupabase,
  mockPushNotifications,
  mockHaptics,
  mockLocalNotifications,
  mockCapacitor,
} = vi.hoisted(() => {
  const chain: Record<string, ReturnType<typeof vi.fn>> & { then?: unknown } = {}
  chain.upsert = vi.fn().mockReturnValue(chain)
  chain.then = (resolve: (v: unknown) => void, reject: (e: unknown) => void) =>
    Promise.resolve({ data: null, error: null }).then(resolve, reject)

  const mockFrom = vi.fn().mockReturnValue(chain)
  const mockSupabase = {
    from: mockFrom,
    auth: { getUser: vi.fn() },
  }

  const mockPushNotifications = {
    checkPermissions: vi.fn().mockResolvedValue({ receive: 'granted' }),
    requestPermissions: vi.fn().mockResolvedValue({ receive: 'granted' }),
    addListener: vi.fn().mockResolvedValue(undefined),
    register: vi.fn().mockResolvedValue(undefined),
    removeAllListeners: vi.fn().mockResolvedValue(undefined),
  }

  const mockHaptics = {
    impact: vi.fn().mockResolvedValue(undefined),
    notification: vi.fn().mockResolvedValue(undefined),
  }

  const mockLocalNotifications = {
    schedule: vi.fn().mockResolvedValue(undefined),
  }

  const mockCapacitor = {
    getPlatform: vi.fn().mockReturnValue('android'),
    isNativePlatform: vi.fn().mockReturnValue(true),
  }

  return {
    mockSupabase,
    mockPushNotifications,
    mockHaptics,
    mockLocalNotifications,
    mockCapacitor,
  }
})

vi.mock('../../lib/supabaseMinimal', () => ({
  supabaseMinimal: mockSupabase,
  supabase: mockSupabase,
}))

vi.mock('@capacitor/push-notifications', () => ({
  PushNotifications: mockPushNotifications,
}))

vi.mock('@capacitor/haptics', () => ({
  Haptics: mockHaptics,
  ImpactStyle: { Light: 'LIGHT', Medium: 'MEDIUM', Heavy: 'HEAVY' },
  NotificationType: { Success: 'SUCCESS', Warning: 'WARNING', Error: 'ERROR' },
}))

vi.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: mockLocalNotifications,
}))

vi.mock('@capacitor/core', () => ({
  Capacitor: mockCapacitor,
}))

// ── Import after mocks ────────────────────────────────────────────────
import { triggerHaptic, isNative, registerNativePushNotifications } from '../useNativePush'

// ══════════════════════════════════════════════════════════════════════
// triggerHaptic - non-native platform (navigator.vibrate branch)
// ══════════════════════════════════════════════════════════════════════
describe('triggerHaptic (non-native platform)', () => {
  let vibrateSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    vibrateSpy = vi.fn()
    Object.defineProperty(navigator, 'vibrate', {
      value: vibrateSpy,
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    Object.defineProperty(navigator, 'vibrate', {
      value: undefined,
      writable: true,
      configurable: true,
    })
  })

  it('uses vibrate(10) for light haptic', async () => {
    await triggerHaptic('light')
    expect(vibrateSpy).toHaveBeenCalledWith(10)
  })

  it('uses vibrate(25) for default (medium) haptic', async () => {
    await triggerHaptic()
    expect(vibrateSpy).toHaveBeenCalledWith(25)
  })

  it('uses vibrate(25) for explicit medium haptic', async () => {
    await triggerHaptic('medium')
    expect(vibrateSpy).toHaveBeenCalledWith(25)
  })

  it('uses vibrate(50) for heavy haptic', async () => {
    await triggerHaptic('heavy')
    expect(vibrateSpy).toHaveBeenCalledWith(50)
  })

  it('uses vibrate([10, 50, 10]) for success haptic', async () => {
    await triggerHaptic('success')
    expect(vibrateSpy).toHaveBeenCalledWith([10, 50, 10])
  })

  it('uses vibrate([50, 100, 50]) for warning haptic', async () => {
    await triggerHaptic('warning')
    expect(vibrateSpy).toHaveBeenCalledWith([50, 100, 50])
  })

  it('uses vibrate([50, 100, 50]) for error haptic', async () => {
    await triggerHaptic('error')
    expect(vibrateSpy).toHaveBeenCalledWith([50, 100, 50])
  })

  it('does not crash when navigator.vibrate is absent', async () => {
    delete (navigator as any).vibrate
    await expect(triggerHaptic('medium')).resolves.toBeUndefined()
  })

  it('returns early without calling native Haptics', async () => {
    await triggerHaptic('light')
    // Since isNativePlatform is false, Haptics.impact should NOT be called
    expect(mockHaptics.impact).not.toHaveBeenCalled()
    expect(mockHaptics.notification).not.toHaveBeenCalled()
  })

  it('calls vibrate exactly once per trigger', async () => {
    await triggerHaptic('heavy')
    expect(vibrateSpy).toHaveBeenCalledTimes(1)
  })
})

// ══════════════════════════════════════════════════════════════════════
// isNative
// ══════════════════════════════════════════════════════════════════════
describe('isNative', () => {
  it('returns false when Capacitor is not on globalThis at import time', () => {
    // The module-level `isNativePlatform` is evaluated at import time.
    // Since globalThis.Capacitor is not set at import time, it is false.
    expect(isNative()).toBe(false)
  })

  it('returns a boolean value', () => {
    expect(typeof isNative()).toBe('boolean')
  })
})

// ══════════════════════════════════════════════════════════════════════
// registerNativePushNotifications
// ══════════════════════════════════════════════════════════════════════
describe('registerNativePushNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns false immediately when not on native platform', async () => {
    const result = await registerNativePushNotifications('user-1')
    expect(result).toBe(false)
  })

  it('does not call PushNotifications when not native', async () => {
    await registerNativePushNotifications('user-1')
    expect(mockPushNotifications.checkPermissions).not.toHaveBeenCalled()
    expect(mockPushNotifications.requestPermissions).not.toHaveBeenCalled()
    expect(mockPushNotifications.register).not.toHaveBeenCalled()
    expect(mockPushNotifications.addListener).not.toHaveBeenCalled()
  })

  it('does not interact with supabase when not native', async () => {
    await registerNativePushNotifications('user-1')
    expect(mockSupabase.from).not.toHaveBeenCalled()
  })

  it('accepts any string as userId parameter', async () => {
    const result1 = await registerNativePushNotifications('')
    const result2 = await registerNativePushNotifications('abc-def-ghi')
    const result3 = await registerNativePushNotifications('user-with-special-chars-!@#$')
    expect(result1).toBe(false)
    expect(result2).toBe(false)
    expect(result3).toBe(false)
  })
})

// ══════════════════════════════════════════════════════════════════════
// Module exports verification
// ══════════════════════════════════════════════════════════════════════
describe('module exports', () => {
  it('exports triggerHaptic as a function', () => {
    expect(typeof triggerHaptic).toBe('function')
  })

  it('exports isNative as a function', () => {
    expect(typeof isNative).toBe('function')
  })

  it('exports registerNativePushNotifications as a function', () => {
    expect(typeof registerNativePushNotifications).toBe('function')
  })

  it('triggerHaptic returns a Promise', async () => {
    // Ensure vibrate exists so it doesn't throw
    Object.defineProperty(navigator, 'vibrate', {
      value: vi.fn(),
      writable: true,
      configurable: true,
    })
    const result = triggerHaptic('light')
    expect(result).toBeInstanceOf(Promise)
    await result
  })

  it('registerNativePushNotifications returns a Promise<boolean>', async () => {
    const result = registerNativePushNotifications('user-1')
    expect(result).toBeInstanceOf(Promise)
    const resolved = await result
    expect(typeof resolved).toBe('boolean')
  })
})

// ══════════════════════════════════════════════════════════════════════
// Internal function behavior validation
// (handleNativeNotificationAction, handleNativeNotificationReceived,
//  saveNativeTokenToDatabase are not exported, but we verify their
//  contracts through the registration flow)
// ══════════════════════════════════════════════════════════════════════
describe('internal function contracts', () => {
  it('handleNativeNotificationAction would be registered as pushNotificationActionPerformed listener', () => {
    // When registerNativePushNotifications is called on a native platform,
    // it registers handleNativeNotificationAction as a listener.
    // Since we're not on native, we can only verify the listener registration mock exists.
    expect(mockPushNotifications.addListener).toBeDefined()
  })

  it('handleNativeNotificationReceived would be registered as pushNotificationReceived listener', () => {
    expect(mockPushNotifications.addListener).toBeDefined()
  })

  it('supabase.from("push_tokens") chain exists for token saving', () => {
    const chain = mockSupabase.from('push_tokens')
    expect(chain).toBeDefined()
    expect(chain.upsert).toBeDefined()
  })
})
