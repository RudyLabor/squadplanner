import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mock WebRTC browser APIs
// ---------------------------------------------------------------------------

function createMockTrack() {
  return { enabled: true, stop: vi.fn(), kind: 'audio' }
}

function createMockMediaStream(track?: ReturnType<typeof createMockTrack>) {
  const t = track || createMockTrack()
  return { getTracks: vi.fn(() => [t]), getAudioTracks: vi.fn(() => [t]), _track: t }
}

let mockPC: Record<string, any>
let mockStream: ReturnType<typeof createMockMediaStream>
let mockGetUserMedia: ReturnType<typeof vi.fn>
let mockAnalyser: Record<string, any>

beforeEach(() => {
  vi.clearAllMocks()

  mockStream = createMockMediaStream()
  mockGetUserMedia = vi.fn().mockResolvedValue(mockStream)

  mockPC = {
    addTrack: vi.fn(),
    close: vi.fn(),
    iceConnectionState: 'new',
    oniceconnectionstatechange: null as any,
    ontrack: null as any,
  }

  mockAnalyser = {
    fftSize: 0,
    frequencyBinCount: 256,
    getByteFrequencyData: vi.fn(),
    connect: vi.fn(),
  }

  const mockSource = { connect: vi.fn() }

  // IMPORTANT: Use regular function (not arrow) so it can be used with `new`
  vi.stubGlobal(
    'RTCPeerConnection',
    vi.fn(function (this: any) {
      Object.assign(this, mockPC)
      // Return the shared mockPC so tests can inspect it
      return mockPC
    })
  )
  vi.stubGlobal(
    'AudioContext',
    vi.fn(function () {
      return {
        createAnalyser: vi.fn(() => mockAnalyser),
        createMediaStreamSource: vi.fn(() => mockSource),
      }
    })
  )
  vi.stubGlobal(
    'Audio',
    vi.fn(function () {
      return { srcObject: null, play: vi.fn() }
    })
  )
  vi.stubGlobal('requestAnimationFrame', vi.fn())

  // Full navigator stub with mediaDevices
  vi.stubGlobal('navigator', {
    mediaDevices: { getUserMedia: mockGetUserMedia },
    userAgent: 'test-agent',
  })

  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('NativeWebRTC', () => {
  async function importModule() {
    return import('../webrtc-native')
  }

  describe('constructor', () => {
    it('should create instance with default state', async () => {
      const { NativeWebRTC } = await importModule()
      const webrtc = new NativeWebRTC({ iceServers: [{ urls: 'stun:stun.example.com:3478' }] })
      expect(webrtc.connected).toBe(false)
      expect(webrtc.muted).toBe(false)
    })
  })

  describe('connect', () => {
    it('should create RTCPeerConnection with provided ICE servers', async () => {
      const { NativeWebRTC } = await importModule()
      const webrtc = new NativeWebRTC({ iceServers: [{ urls: 'stun:stun.example.com:3478' }] })
      await webrtc.connectLocalOnly()
      expect(RTCPeerConnection).toHaveBeenCalledWith({
        iceServers: [{ urls: 'stun:stun.example.com:3478' }],
      })
    })

    it('should return true on successful connection', async () => {
      const { NativeWebRTC } = await importModule()
      const webrtc = new NativeWebRTC({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
      const result = await webrtc.connectLocalOnly()
      expect(result).toBe(true)
    })

    it('should assign oniceconnectionstatechange handler', async () => {
      const { NativeWebRTC } = await importModule()
      const webrtc = new NativeWebRTC({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
      await webrtc.connectLocalOnly()
      expect(typeof mockPC.oniceconnectionstatechange).toBe('function')
    })

    it('should update connected state via ice handler', async () => {
      const { NativeWebRTC } = await importModule()
      const webrtc = new NativeWebRTC({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
      const spy = vi.fn()
      webrtc.onConnectionStateChange = spy

      await webrtc.connectLocalOnly()
      mockPC.iceConnectionState = 'connected'
      mockPC.oniceconnectionstatechange()

      expect(spy).toHaveBeenCalledWith('connected')
      expect(webrtc.connected).toBe(true)
    })

    it('should set connected false for disconnected/failed states', async () => {
      const { NativeWebRTC } = await importModule()
      const webrtc = new NativeWebRTC({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
      await webrtc.connectLocalOnly()

      mockPC.iceConnectionState = 'disconnected'
      mockPC.oniceconnectionstatechange()
      expect(webrtc.connected).toBe(false)

      mockPC.iceConnectionState = 'failed'
      mockPC.oniceconnectionstatechange()
      expect(webrtc.connected).toBe(false)
    })

    it('should assign ontrack handler', async () => {
      const { NativeWebRTC } = await importModule()
      const webrtc = new NativeWebRTC({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
      await webrtc.connectLocalOnly()
      expect(typeof mockPC.ontrack).toBe('function')
    })

    it('should call getUserMedia for microphone', async () => {
      const { NativeWebRTC } = await importModule()
      const webrtc = new NativeWebRTC({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
      await webrtc.connectLocalOnly()
      expect(mockGetUserMedia).toHaveBeenCalledWith({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      })
    })

    it('should return false when RTCPeerConnection constructor throws', async () => {
      vi.stubGlobal(
        'RTCPeerConnection',
        vi.fn(function () {
          throw new Error('RTC not supported')
        })
      )
      const { NativeWebRTC } = await importModule()
      const webrtc = new NativeWebRTC({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
      const result = await webrtc.connectLocalOnly()
      expect(result).toBe(false)
      expect(console.error).toHaveBeenCalledWith(
        '[NativeWebRTC] Local connect failed:',
        expect.any(Error)
      )
    })

    it('should return false when microphone access is denied', async () => {
      mockGetUserMedia.mockRejectedValue(new Error('Permission denied'))
      const { NativeWebRTC } = await importModule()
      const webrtc = new NativeWebRTC({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
      const result = await webrtc.connectLocalOnly()
      expect(result).toBe(false)
      expect(console.error).toHaveBeenCalledWith(
        '[NativeWebRTC] Microphone access failed:',
        expect.any(Error)
      )
      expect(console.error).toHaveBeenCalledWith(
        '[NativeWebRTC] Microphone required for party — access denied or unavailable'
      )
    })
  })

  describe('enableMicrophone', () => {
    it('should request audio with correct constraints', async () => {
      const { NativeWebRTC } = await importModule()
      const webrtc = new NativeWebRTC({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
      await webrtc.connectLocalOnly()
      mockGetUserMedia.mockClear()
      const result = await webrtc.enableMicrophone()
      expect(result).toBe(true)
      expect(mockGetUserMedia).toHaveBeenCalledWith({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      })
    })

    it('should add audio tracks to peer connection', async () => {
      const { NativeWebRTC } = await importModule()
      const webrtc = new NativeWebRTC({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
      await webrtc.connectLocalOnly()
      expect(mockPC.addTrack).toHaveBeenCalledWith(mockStream._track, mockStream)
    })

    it('should return false on failure', async () => {
      mockGetUserMedia.mockRejectedValue(new Error('Not allowed'))
      const { NativeWebRTC } = await importModule()
      const webrtc = new NativeWebRTC({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
      const result = await webrtc.enableMicrophone()
      expect(result).toBe(false)
      expect(console.error).toHaveBeenCalledWith(
        '[NativeWebRTC] Microphone access failed:',
        expect.any(Error)
      )
    })
  })

  describe('toggleMute', () => {
    it('should return false when no local stream', async () => {
      const { NativeWebRTC } = await importModule()
      const webrtc = new NativeWebRTC({ iceServers: [] })
      expect(webrtc.toggleMute()).toBe(false)
    })

    it('should toggle audio track enabled/disabled', async () => {
      const { NativeWebRTC } = await importModule()
      const webrtc = new NativeWebRTC({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
      await webrtc.connectLocalOnly()

      expect(webrtc.muted).toBe(false)
      expect(webrtc.toggleMute()).toBe(true)
      expect(webrtc.muted).toBe(true)
      expect(mockStream._track.enabled).toBe(false)

      expect(webrtc.toggleMute()).toBe(false)
      expect(webrtc.muted).toBe(false)
      expect(mockStream._track.enabled).toBe(true)
    })

    it('should return false when no audio track exists', async () => {
      mockGetUserMedia.mockResolvedValue({ getTracks: () => [], getAudioTracks: () => [] })
      const { NativeWebRTC } = await importModule()
      const webrtc = new NativeWebRTC({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
      await webrtc.connectLocalOnly()
      expect(webrtc.toggleMute()).toBe(false)
    })
  })

  describe('setVolume', () => {
    it('should not throw', async () => {
      const { NativeWebRTC } = await importModule()
      const webrtc = new NativeWebRTC({ iceServers: [] })
      expect(() => webrtc.setVolume(0.75)).not.toThrow()
    })

    it('should accept zero', async () => {
      const { NativeWebRTC } = await importModule()
      const webrtc = new NativeWebRTC({ iceServers: [] })
      expect(() => webrtc.setVolume(0)).not.toThrow()
    })
  })

  describe('disconnect', () => {
    it('should stop tracks and close peer connection', async () => {
      const { NativeWebRTC } = await importModule()
      const webrtc = new NativeWebRTC({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
      await webrtc.connectLocalOnly()
      webrtc.disconnect()
      expect(mockStream._track.stop).toHaveBeenCalled()
      expect(mockPC.close).toHaveBeenCalled()
    })

    it('should reset connected and muted', async () => {
      const { NativeWebRTC } = await importModule()
      const webrtc = new NativeWebRTC({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
      await webrtc.connectLocalOnly()
      mockPC.iceConnectionState = 'connected'
      mockPC.oniceconnectionstatechange()
      webrtc.toggleMute()
      expect(webrtc.connected).toBe(true)
      expect(webrtc.muted).toBe(true)
      webrtc.disconnect()
      expect(webrtc.connected).toBe(false)
      expect(webrtc.muted).toBe(false)
    })

    it('should not throw without prior connect', async () => {
      const { NativeWebRTC } = await importModule()
      expect(() => new NativeWebRTC({ iceServers: [] }).disconnect()).not.toThrow()
    })

    it('should not throw on double disconnect', async () => {
      const { NativeWebRTC } = await importModule()
      const webrtc = new NativeWebRTC({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
      await webrtc.connectLocalOnly()
      webrtc.disconnect()
      expect(() => webrtc.disconnect()).not.toThrow()
    })
  })

  describe('getters', () => {
    it('connected reflects ice state', async () => {
      const { NativeWebRTC } = await importModule()
      const webrtc = new NativeWebRTC({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
      expect(webrtc.connected).toBe(false)
      await webrtc.connectLocalOnly()
      mockPC.iceConnectionState = 'connected'
      mockPC.oniceconnectionstatechange()
      expect(webrtc.connected).toBe(true)
    })

    it('muted reflects toggle state', async () => {
      const { NativeWebRTC } = await importModule()
      const webrtc = new NativeWebRTC({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
      expect(webrtc.muted).toBe(false)
      await webrtc.connectLocalOnly()
      webrtc.toggleMute()
      expect(webrtc.muted).toBe(true)
    })
  })

  describe('Voice Activity Detection', () => {
    it('should set up AudioContext for VAD', async () => {
      const { NativeWebRTC } = await importModule()
      const webrtc = new NativeWebRTC({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
      await webrtc.connectLocalOnly()
      expect(AudioContext).toHaveBeenCalled()
    })

    it('should handle VAD setup failure gracefully', async () => {
      vi.stubGlobal(
        'AudioContext',
        vi.fn(() => {
          throw new Error('Not supported')
        })
      )
      const { NativeWebRTC } = await importModule()
      const webrtc = new NativeWebRTC({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
      const result = await webrtc.connectLocalOnly()
      expect(result).toBe(true)
      expect(console.warn).toHaveBeenCalledWith(
        '[NativeWebRTC] VAD setup failed:',
        expect.any(Error)
      )
    })

    it('should detect speaking (RMS > 10)', async () => {
      const spy = vi.fn()
      mockAnalyser.getByteFrequencyData = vi.fn((arr: Uint8Array) => {
        for (let i = 0; i < arr.length; i++) arr[i] = 100
      })
      const { NativeWebRTC } = await importModule()
      const webrtc = new NativeWebRTC({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
      webrtc.onSpeaking = spy
      await webrtc.connectLocalOnly()
      expect(spy).toHaveBeenCalledWith('local', true)
    })

    it('should detect silence (RMS <= 10)', async () => {
      const spy = vi.fn()
      mockAnalyser.getByteFrequencyData = vi.fn((arr: Uint8Array) => {
        for (let i = 0; i < arr.length; i++) arr[i] = 0
      })
      const { NativeWebRTC } = await importModule()
      const webrtc = new NativeWebRTC({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
      webrtc.onSpeaking = spy
      await webrtc.connectLocalOnly()
      expect(spy).toHaveBeenCalledWith('local', false)
    })
  })

  describe('ontrack handler', () => {
    it('should auto-play remote audio', async () => {
      const mockAudio = {
        srcObject: null as any,
        autoplay: false,
        play: vi.fn().mockResolvedValue(undefined),
      }
      vi.stubGlobal(
        'Audio',
        vi.fn(function () {
          return mockAudio
        })
      )
      const { NativeWebRTC } = await importModule()
      const webrtc = new NativeWebRTC({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
      await webrtc.connectLocalOnly()
      const remoteStream = createMockMediaStream()
      mockPC.ontrack({ streams: [remoteStream] })
      expect(mockAudio.play).toHaveBeenCalled()
      expect(mockAudio.srcObject).toBe(remoteStream)
    })
  })

  describe('event callbacks', () => {
    it('should fire onConnectionStateChange', async () => {
      const { NativeWebRTC } = await importModule()
      const webrtc = new NativeWebRTC({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
      const cb = vi.fn()
      webrtc.onConnectionStateChange = cb
      await webrtc.connectLocalOnly()
      mockPC.iceConnectionState = 'checking'
      mockPC.oniceconnectionstatechange()
      expect(cb).toHaveBeenCalledWith('checking')
    })

    it('should allow setting onRemoteUser', async () => {
      const { NativeWebRTC } = await importModule()
      const webrtc = new NativeWebRTC({ iceServers: [] })
      const cb = vi.fn()
      webrtc.onRemoteUser = cb
      expect(webrtc.onRemoteUser).toBe(cb)
    })

    it('should allow setting onUserLeft', async () => {
      const { NativeWebRTC } = await importModule()
      const webrtc = new NativeWebRTC({ iceServers: [] })
      const cb = vi.fn()
      webrtc.onUserLeft = cb
      expect(webrtc.onUserLeft).toBe(cb)
    })

    it('should allow setting onSpeaking', async () => {
      const { NativeWebRTC } = await importModule()
      const webrtc = new NativeWebRTC({ iceServers: [] })
      const cb = vi.fn()
      webrtc.onSpeaking = cb
      expect(webrtc.onSpeaking).toBe(cb)
    })
  })
})
