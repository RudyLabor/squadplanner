import { useEffect, useRef, useState, useCallback } from 'react'

export interface AudioAnalyserData {
  frequencyData: Uint8Array
  averageVolume: number
  isActive: boolean
  isSpeaking: boolean
  volumeLevel: 'silent' | 'speaking' | 'loud'
}

const SPEAKING_THRESHOLD = 30
const LOUD_THRESHOLD = 150

/**
 * Custom hook for real-time audio analysis using Web Audio API
 * @param stream - MediaStream from microphone or other audio source
 * @returns AudioAnalyserData with frequency data and volume information
 */
export function useAudioAnalyser(stream: MediaStream | null): AudioAnalyserData {
  const [frequencyData, setFrequencyData] = useState<Uint8Array>(new Uint8Array(16))
  const [averageVolume, setAverageVolume] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [volumeLevel, setVolumeLevel] = useState<'silent' | 'speaking' | 'loud'>('silent')

  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const dataArrayRef = useRef<Uint8Array>(new Uint8Array(16))

  const analyze = useCallback(() => {
    if (!analyserRef.current) return

    analyserRef.current.getByteFrequencyData(dataArrayRef.current as unknown as Uint8Array<ArrayBuffer>)

    // Calculate average volume
    const sum = dataArrayRef.current.reduce((acc, val) => acc + val, 0)
    const avg = sum / dataArrayRef.current.length

    // Determine volume level
    let level: 'silent' | 'speaking' | 'loud' = 'silent'
    if (avg > LOUD_THRESHOLD) {
      level = 'loud'
    } else if (avg > SPEAKING_THRESHOLD) {
      level = 'speaking'
    }

    // Update state with new data (copy array to avoid reference issues)
    setFrequencyData(new Uint8Array(dataArrayRef.current))
    setAverageVolume(avg)
    setVolumeLevel(level)

    // Continue animation loop
    animationFrameRef.current = requestAnimationFrame(analyze)
  }, [])

  useEffect(() => {
    if (!stream) {
      // Clean up when stream is removed
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect()
        sourceRef.current = null
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
      analyserRef.current = null
      setIsActive(false)
      setFrequencyData(new Uint8Array(16))
      setAverageVolume(0)
      setVolumeLevel('silent')
      return
    }

    // Create audio context and analyser
    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      audioContextRef.current = audioContext

      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 32 // 16 frequency bins
      analyser.smoothingTimeConstant = 0.8 // Smooth out rapid changes
      analyserRef.current = analyser
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount)

      // Connect stream to analyser
      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)
      sourceRef.current = source

      // Start analyzing
      setIsActive(true)
      analyze()
    } catch (error) {
      console.error('Failed to create audio analyser:', error)
      setIsActive(false)
    }

    // Cleanup function
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect()
        sourceRef.current = null
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
      analyserRef.current = null
    }
  }, [stream, analyze])

  return {
    frequencyData,
    averageVolume,
    isActive,
    isSpeaking: volumeLevel !== 'silent',
    volumeLevel
  }
}

export default useAudioAnalyser
