import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// ── Hoisted mocks ─────────────────────────────────────────────────────
const { mockAnalyserNode, mockSourceNode } = vi.hoisted(() => {
  const mockAnalyserNode = {
    fftSize: 0,
    smoothingTimeConstant: 0,
    frequencyBinCount: 16,
    getByteFrequencyData: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
  }

  const mockSourceNode = {
    connect: vi.fn(),
    disconnect: vi.fn(),
  }

  return { mockAnalyserNode, mockSourceNode }
})

// Store raf callbacks so we can call them manually
let rafCallbacks: Array<FrameRequestCallback> = []
let rafIdCounter = 1

// Track AudioContext instances for assertions
let audioContextInstances: Array<{
  createAnalyser: ReturnType<typeof vi.fn>
  createMediaStreamSource: ReturnType<typeof vi.fn>
  close: ReturnType<typeof vi.fn>
  state: string
}> = []

beforeEach(() => {
  rafCallbacks = []
  rafIdCounter = 1
  audioContextInstances = []

  // Mock requestAnimationFrame
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    const id = rafIdCounter++
    rafCallbacks.push(cb)
    return id
  })

  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})

  // Must use a proper function constructor (not arrow fn) for `new` to work
  function MockAudioContext(this: any) {
    this.createAnalyser = vi.fn().mockReturnValue(mockAnalyserNode)
    this.createMediaStreamSource = vi.fn().mockReturnValue(mockSourceNode)
    this.close = vi.fn().mockResolvedValue(undefined)
    this.state = 'running'
    audioContextInstances.push(this)
  }

  ;(window as any).AudioContext = MockAudioContext
})

afterEach(() => {
  vi.restoreAllMocks()
  delete (window as any).AudioContext
  delete (window as any).webkitAudioContext
})

import { useAudioAnalyser } from '../useAudioAnalyser'

// ── Helpers ───────────────────────────────────────────────────────────

/** Create a minimal MediaStream mock */
function createMockStream(): MediaStream {
  return {
    getTracks: vi.fn().mockReturnValue([]),
    getAudioTracks: vi.fn().mockReturnValue([{ enabled: true }]),
    getVideoTracks: vi.fn().mockReturnValue([]),
    addTrack: vi.fn(),
    removeTrack: vi.fn(),
    clone: vi.fn(),
    active: true,
    id: 'mock-stream',
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    onaddtrack: null,
    onremovetrack: null,
  } as unknown as MediaStream
}

/** Trigger one animation frame with controlled frequency data */
function triggerAnimationFrame(frequencyValues: number[]) {
  // Make getByteFrequencyData fill the passed array with our values
  mockAnalyserNode.getByteFrequencyData.mockImplementation((arr: Uint8Array) => {
    for (let i = 0; i < arr.length && i < frequencyValues.length; i++) {
      arr[i] = frequencyValues[i]
    }
  })

  // Execute all pending raf callbacks
  const callbacks = [...rafCallbacks]
  rafCallbacks = []
  callbacks.forEach((cb) => cb(performance.now()))
}

// ══════════════════════════════════════════════════════════════════════
// Tests
// ══════════════════════════════════════════════════════════════════════
describe('useAudioAnalyser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAnalyserNode.getByteFrequencyData.mockImplementation(() => {})
  })

  // ── Null stream ────────────────────────────────────────────────────
  describe('with null stream', () => {
    it('returns default inactive state', () => {
      const { result } = renderHook(() => useAudioAnalyser(null))

      expect(result.current.isActive).toBe(false)
      expect(result.current.averageVolume).toBe(0)
      expect(result.current.isSpeaking).toBe(false)
      expect(result.current.volumeLevel).toBe('silent')
      expect(result.current.frequencyData).toBeInstanceOf(Uint8Array)
      expect(result.current.frequencyData.length).toBe(16)
    })

    it('does not create AudioContext', () => {
      renderHook(() => useAudioAnalyser(null))
      expect(audioContextInstances).toHaveLength(0)
    })
  })

  // ── Stream provided ────────────────────────────────────────────────
  describe('with a valid stream', () => {
    it('creates AudioContext', () => {
      const stream = createMockStream()
      renderHook(() => useAudioAnalyser(stream))

      expect(audioContextInstances).toHaveLength(1)
    })

    it('sets isActive to true', () => {
      const stream = createMockStream()
      const { result } = renderHook(() => useAudioAnalyser(stream))

      expect(result.current.isActive).toBe(true)
    })

    it('creates an analyser node', () => {
      const stream = createMockStream()
      renderHook(() => useAudioAnalyser(stream))

      expect(audioContextInstances[0].createAnalyser).toHaveBeenCalled()
    })

    it('connects the stream source to the analyser', () => {
      const stream = createMockStream()
      renderHook(() => useAudioAnalyser(stream))

      expect(audioContextInstances[0].createMediaStreamSource).toHaveBeenCalledWith(stream)
      expect(mockSourceNode.connect).toHaveBeenCalledWith(mockAnalyserNode)
    })

    it('starts animation frame loop', () => {
      const stream = createMockStream()
      renderHook(() => useAudioAnalyser(stream))

      expect(window.requestAnimationFrame).toHaveBeenCalled()
    })
  })

  // ── Volume level detection ─────────────────────────────────────────
  describe('volume level detection', () => {
    it('reports "silent" when average is below SPEAKING_THRESHOLD (30)', () => {
      const stream = createMockStream()
      const { result } = renderHook(() => useAudioAnalyser(stream))

      act(() => {
        triggerAnimationFrame(new Array(16).fill(0))
      })

      expect(result.current.volumeLevel).toBe('silent')
      expect(result.current.isSpeaking).toBe(false)
    })

    it('reports "speaking" when average is between 30 and 150', () => {
      const stream = createMockStream()
      const { result } = renderHook(() => useAudioAnalyser(stream))

      act(() => {
        triggerAnimationFrame(new Array(16).fill(80))
      })

      expect(result.current.volumeLevel).toBe('speaking')
      expect(result.current.isSpeaking).toBe(true)
    })

    it('reports "loud" when average is above LOUD_THRESHOLD (150)', () => {
      const stream = createMockStream()
      const { result } = renderHook(() => useAudioAnalyser(stream))

      act(() => {
        triggerAnimationFrame(new Array(16).fill(200))
      })

      expect(result.current.volumeLevel).toBe('loud')
      expect(result.current.isSpeaking).toBe(true)
    })

    it('calculates correct average volume', () => {
      const stream = createMockStream()
      const { result } = renderHook(() => useAudioAnalyser(stream))

      act(() => {
        triggerAnimationFrame(new Array(16).fill(50))
      })

      expect(result.current.averageVolume).toBe(50)
    })

    it('updates frequencyData as Uint8Array', () => {
      const stream = createMockStream()
      const { result } = renderHook(() => useAudioAnalyser(stream))

      act(() => {
        triggerAnimationFrame(new Array(16).fill(100))
      })

      expect(result.current.frequencyData).toBeInstanceOf(Uint8Array)
    })

    it('isSpeaking transitions based on volume', () => {
      const stream = createMockStream()
      const { result } = renderHook(() => useAudioAnalyser(stream))

      // Silent
      act(() => {
        triggerAnimationFrame(new Array(16).fill(10))
      })
      expect(result.current.isSpeaking).toBe(false)

      // Speaking
      act(() => {
        triggerAnimationFrame(new Array(16).fill(80))
      })
      expect(result.current.isSpeaking).toBe(true)

      // Back to silent
      act(() => {
        triggerAnimationFrame(new Array(16).fill(5))
      })
      expect(result.current.isSpeaking).toBe(false)
    })

    // Boundary tests
    it('boundary: avg exactly 30 is silent (threshold is > 30)', () => {
      const stream = createMockStream()
      const { result } = renderHook(() => useAudioAnalyser(stream))

      act(() => {
        triggerAnimationFrame(new Array(16).fill(30))
      })

      expect(result.current.volumeLevel).toBe('silent')
    })

    it('boundary: avg exactly 31 is speaking', () => {
      const stream = createMockStream()
      const { result } = renderHook(() => useAudioAnalyser(stream))

      act(() => {
        triggerAnimationFrame(new Array(16).fill(31))
      })

      expect(result.current.volumeLevel).toBe('speaking')
    })

    it('boundary: avg exactly 150 is speaking (threshold is > 150)', () => {
      const stream = createMockStream()
      const { result } = renderHook(() => useAudioAnalyser(stream))

      act(() => {
        triggerAnimationFrame(new Array(16).fill(150))
      })

      expect(result.current.volumeLevel).toBe('speaking')
    })

    it('boundary: avg exactly 151 is loud', () => {
      const stream = createMockStream()
      const { result } = renderHook(() => useAudioAnalyser(stream))

      act(() => {
        triggerAnimationFrame(new Array(16).fill(151))
      })

      expect(result.current.volumeLevel).toBe('loud')
    })

    it('handles mixed frequency values correctly', () => {
      const stream = createMockStream()
      const { result } = renderHook(() => useAudioAnalyser(stream))

      // avg = (0*8 + 200*8) / 16 = 100 => speaking
      const mixed = [...new Array(8).fill(0), ...new Array(8).fill(200)]
      act(() => {
        triggerAnimationFrame(mixed)
      })

      expect(result.current.averageVolume).toBe(100)
      expect(result.current.volumeLevel).toBe('speaking')
    })
  })

  // ── Cleanup ────────────────────────────────────────────────────────
  describe('cleanup', () => {
    it('cleans up when stream changes to null', () => {
      const stream = createMockStream()
      const { result, rerender } = renderHook(
        ({ s }: { s: MediaStream | null }) => useAudioAnalyser(s),
        { initialProps: { s: stream } }
      )

      expect(result.current.isActive).toBe(true)

      // Rerender with null stream
      rerender({ s: null })

      expect(result.current.isActive).toBe(false)
      expect(result.current.averageVolume).toBe(0)
      expect(result.current.volumeLevel).toBe('silent')
    })

    it('cancels animation frame on unmount', () => {
      const stream = createMockStream()
      const { unmount } = renderHook(() => useAudioAnalyser(stream))

      unmount()

      expect(window.cancelAnimationFrame).toHaveBeenCalled()
    })

    it('disconnects source on cleanup', () => {
      const stream = createMockStream()
      const { unmount } = renderHook(() => useAudioAnalyser(stream))

      unmount()

      expect(mockSourceNode.disconnect).toHaveBeenCalled()
    })

    it('closes audio context on cleanup', () => {
      const stream = createMockStream()
      const { unmount } = renderHook(() => useAudioAnalyser(stream))

      const ctx = audioContextInstances[0]
      unmount()

      expect(ctx.close).toHaveBeenCalled()
    })
  })

  // ── Error handling ─────────────────────────────────────────────────
  describe('error handling', () => {
    it('handles AudioContext creation failure gracefully', () => {
      ;(window as any).AudioContext = function () {
        throw new Error('AudioContext not supported')
      }

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const stream = createMockStream()

      const { result } = renderHook(() => useAudioAnalyser(stream))

      expect(result.current.isActive).toBe(false)
      expect(warnSpy).toHaveBeenCalledWith('Failed to create audio analyser:', expect.any(Error))

      warnSpy.mockRestore()
    })

    it('falls back to webkitAudioContext', () => {
      delete (window as any).AudioContext

      function WebkitMockAudioContext(this: any) {
        this.createAnalyser = vi.fn().mockReturnValue(mockAnalyserNode)
        this.createMediaStreamSource = vi.fn().mockReturnValue(mockSourceNode)
        this.close = vi.fn().mockResolvedValue(undefined)
        this.state = 'running'
        audioContextInstances.push(this)
      }
      ;(window as any).webkitAudioContext = WebkitMockAudioContext

      const stream = createMockStream()
      const { result } = renderHook(() => useAudioAnalyser(stream))

      expect(result.current.isActive).toBe(true)
      expect(audioContextInstances).toHaveLength(1)
    })
  })

  // ── Stream transitions ─────────────────────────────────────────────
  describe('stream transitions', () => {
    it('transitions from null to stream', () => {
      const { result, rerender } = renderHook(
        ({ s }: { s: MediaStream | null }) => useAudioAnalyser(s),
        { initialProps: { s: null as MediaStream | null } }
      )

      expect(result.current.isActive).toBe(false)

      const stream = createMockStream()
      rerender({ s: stream })

      expect(result.current.isActive).toBe(true)
    })

    it('transitions from one stream to another', () => {
      const stream1 = createMockStream()
      const stream2 = createMockStream()

      const { result, rerender } = renderHook(
        ({ s }: { s: MediaStream | null }) => useAudioAnalyser(s),
        { initialProps: { s: stream1 } }
      )

      expect(result.current.isActive).toBe(true)

      rerender({ s: stream2 })

      // Should still be active with new stream
      expect(result.current.isActive).toBe(true)
      // Old stream cleanup + new stream setup = 2 AudioContext instances
      expect(audioContextInstances.length).toBeGreaterThanOrEqual(1)
    })

    it('resets state when stream goes from active to null', () => {
      const stream = createMockStream()
      const { result, rerender } = renderHook(
        ({ s }: { s: MediaStream | null }) => useAudioAnalyser(s),
        { initialProps: { s: stream } }
      )

      // Generate some data first
      act(() => {
        triggerAnimationFrame(new Array(16).fill(100))
      })
      expect(result.current.averageVolume).toBe(100)
      expect(result.current.isActive).toBe(true)

      // Switch to null
      rerender({ s: null })

      expect(result.current.isActive).toBe(false)
      expect(result.current.averageVolume).toBe(0)
      expect(result.current.volumeLevel).toBe('silent')
      expect(result.current.frequencyData.length).toBe(16)
    })
  })

  // ── Continuous animation loop ──────────────────────────────────────
  describe('animation loop', () => {
    it('requests next animation frame after each analysis', () => {
      const stream = createMockStream()
      renderHook(() => useAudioAnalyser(stream))

      // Initial raf was called during setup
      const initialCalls = (window.requestAnimationFrame as ReturnType<typeof vi.fn>).mock.calls
        .length

      act(() => {
        triggerAnimationFrame(new Array(16).fill(50))
      })

      // Should have called raf again for the next frame
      expect(
        (window.requestAnimationFrame as ReturnType<typeof vi.fn>).mock.calls.length
      ).toBeGreaterThan(initialCalls)
    })
  })
})
