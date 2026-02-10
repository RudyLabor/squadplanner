import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// We need to create fresh mocks for each test since the hook uses a singleton
const mockOscillatorStop = vi.fn()
const mockOscillatorDisconnect = vi.fn()
const mockOscillatorConnect = vi.fn()
const mockOscillatorStart = vi.fn()

const mockGainConnect = vi.fn()

function createMockOscillator() {
  return {
    frequency: { value: 0 },
    type: 'sine' as OscillatorType,
    connect: mockOscillatorConnect,
    start: mockOscillatorStart,
    stop: mockOscillatorStop,
    disconnect: mockOscillatorDisconnect,
  }
}

function createMockGainNode() {
  return {
    gain: { value: 0, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    connect: mockGainConnect,
  }
}

const mockAudioContextInstance = {
  state: 'running' as string,
  resume: vi.fn().mockResolvedValue(undefined),
  createOscillator: vi.fn().mockImplementation(createMockOscillator),
  createGain: vi.fn().mockImplementation(createMockGainNode),
  destination: {},
  currentTime: 0,
}

// Mock window.AudioContext as a class constructor
class MockAudioContext {
  state = mockAudioContextInstance.state
  resume = mockAudioContextInstance.resume
  createOscillator = mockAudioContextInstance.createOscillator
  createGain = mockAudioContextInstance.createGain
  destination = mockAudioContextInstance.destination
  currentTime = mockAudioContextInstance.currentTime
}

Object.defineProperty(window, 'AudioContext', {
  writable: true,
  value: MockAudioContext,
})

// Mock navigator.vibrate
Object.defineProperty(navigator, 'vibrate', {
  writable: true,
  value: vi.fn().mockReturnValue(true),
})

// We must reset the singleton audioContext between tests
// The module keeps a singleton; we need to reimport cleanly
// Use vi.resetModules and dynamic imports for isolation
describe('useRingtone', () => {
  let useRingtone: typeof import('../useRingtone').useRingtone

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    mockAudioContextInstance.state = 'running'
    mockAudioContextInstance.createOscillator.mockImplementation(createMockOscillator)
    mockAudioContextInstance.createGain.mockImplementation(createMockGainNode)

    // Reset module to clear the singleton audioContext
    vi.resetModules()
    const mod = await import('../useRingtone')
    useRingtone = mod.useRingtone
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('initial state: isPlaying false', () => {
    const { result } = renderHook(() => useRingtone(false))

    expect(result.current.isPlaying).toBe(false)
  })

  it('starts playing when shouldPlay becomes true', () => {
    const { rerender } = renderHook(
      ({ shouldPlay }) => useRingtone(shouldPlay),
      { initialProps: { shouldPlay: false } }
    )

    // Rerender with shouldPlay=true
    rerender({ shouldPlay: true })

    // playRingtone should have been called, which creates audio nodes
    expect(mockAudioContextInstance.createOscillator).toHaveBeenCalled()
    expect(mockAudioContextInstance.createGain).toHaveBeenCalled()
  })

  it('stops playing when shouldPlay becomes false', () => {
    const { rerender } = renderHook(
      ({ shouldPlay }) => useRingtone(shouldPlay),
      { initialProps: { shouldPlay: true } }
    )

    // Start playing
    expect(mockAudioContextInstance.createOscillator).toHaveBeenCalled()

    // Clear mocks to track stop-specific calls
    mockOscillatorStop.mockClear()
    mockOscillatorDisconnect.mockClear()

    // Rerender with shouldPlay=false triggers the effect cleanup which calls stopRingtone
    rerender({ shouldPlay: false })

    // stopRingtone should have been called, stopping and disconnecting oscillators
    expect(mockOscillatorStop).toHaveBeenCalled()
    expect(mockOscillatorDisconnect).toHaveBeenCalled()
  })

  it('play creates oscillators and gain node', () => {
    const { result } = renderHook(() => useRingtone(false))

    act(() => {
      result.current.play()
    })

    expect(mockAudioContextInstance.createOscillator).toHaveBeenCalled()
    expect(mockAudioContextInstance.createGain).toHaveBeenCalled()
    expect(mockGainConnect).toHaveBeenCalled()
    expect(mockOscillatorConnect).toHaveBeenCalled()
    expect(mockOscillatorStart).toHaveBeenCalled()
  })

  it('stop disconnects oscillators and clears intervals', () => {
    const { result } = renderHook(() => useRingtone(true))

    // Oscillators are created on play
    expect(mockAudioContextInstance.createOscillator).toHaveBeenCalled()

    // Now stop
    act(() => {
      result.current.stop()
    })

    expect(result.current.isPlaying).toBe(false)
    expect(mockOscillatorStop).toHaveBeenCalled()
    expect(mockOscillatorDisconnect).toHaveBeenCalled()
  })

  it('cleanup stops ringtone on unmount', () => {
    const { unmount } = renderHook(() => useRingtone(true))

    // Verify playing started
    expect(mockAudioContextInstance.createOscillator).toHaveBeenCalled()

    // Unmount should trigger cleanup (stopRingtone)
    unmount()

    // The oscillators should have been stopped/disconnected during cleanup
    expect(mockOscillatorStop).toHaveBeenCalled()
  })
})
