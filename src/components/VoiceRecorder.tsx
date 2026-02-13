'use client'

import { useState, useRef, useCallback, useEffect, memo } from 'react'
// framer-motion removed to prevent flickering on mobile
import { Mic, Square, Send, Trash2, Loader2 } from './icons'
/**
 * VoiceRecorder — Phase 3.1
 * Records voice messages using MediaRecorder API.
 * Outputs a Blob (audio/webm) that can be uploaded to Supabase storage.
 */

interface VoiceRecorderProps {
  onSend: (audioBlob: Blob, duration: number) => void
  disabled?: boolean
}

export const VoiceRecorder = memo(function VoiceRecorder({ onSend, disabled }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef(0)
  const streamRef = useRef<MediaStream | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (audioUrl) URL.revokeObjectURL(audioUrl)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
      }
    }
  }, [audioUrl])

  const startRecording = useCallback(async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      streamRef.current = stream

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      })

      chunks.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunks.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }

      mediaRecorder.current = recorder
      recorder.start(100) // Collect data every 100ms

      setIsRecording(true)
      startTimeRef.current = Date.now()

      // Duration counter
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 200)
    } catch (err) {
      console.error('Microphone access denied:', err)
      setError('Accès au micro refusé')
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop()
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setIsRecording(false)
  }, [])

  const cancelRecording = useCallback(() => {
    if (isRecording) {
      if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
        mediaRecorder.current.stop()
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
    }
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setIsRecording(false)
    setAudioBlob(null)
    setAudioUrl(null)
    setDuration(0)
    setError(null)
  }, [isRecording, audioUrl])

  const handleSend = useCallback(async () => {
    if (!audioBlob) return
    setIsSending(true)
    try {
      await onSend(audioBlob, duration)
      cancelRecording()
    } finally {
      setIsSending(false)
    }
  }, [audioBlob, duration, onSend, cancelRecording])

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  // Simple waveform visualization during recording
  const [waveform, setWaveform] = useState<number[]>(new Array(20).fill(3))

  useEffect(() => {
    if (!isRecording) {
      setWaveform(new Array(20).fill(3))
      return
    }

    const interval = setInterval(() => {
      setWaveform((prev) => prev.map(() => Math.random() * 20 + 3))
    }, 100)

    return () => clearInterval(interval)
  }, [isRecording])

  return (
    <div className="relative">
      {/* Error state */}
      {error && (
        <p className="text-sm text-error mb-1">
          {error}
        </p>
      )}

      {/* Recording / Preview state */}
      {isRecording || audioBlob ? (
        <div className="flex items-center gap-2 h-12 px-3 bg-bg-surface border border-border-default rounded-xl">
          {/* Cancel */}
          <button
            type="button"
            onClick={cancelRecording}
            className="p-1.5 rounded-lg text-error hover:bg-error/10 transition-colors"
            aria-label="Annuler"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Waveform / Audio player */}
          <div className="flex-1 flex items-center gap-1">
            {isRecording ? (
              // Live waveform
              <div className="flex items-center gap-[2px] h-6">
                {waveform.map((h, i) => (
                  <div
                    key={i}
                    className="w-[3px] rounded-full bg-error transition-all duration-100"
                    style={{ height: `${h}px` }}
                  />
                ))}
              </div>
            ) : audioUrl ? (
              // Playback
              <audio
                src={audioUrl}
                controls
                className="h-8 w-full max-w-[200px] [&::-webkit-media-controls-panel]:bg-transparent"
              />
            ) : null}
          </div>

          {/* Duration */}
          <span
            className={`text-base font-mono min-w-[40px] text-center ${isRecording ? 'text-error' : 'text-text-tertiary'}`}
          >
            {formatDuration(duration)}
          </span>

          {/* Stop or Send */}
          {isRecording ? (
            <button
              type="button"
              onClick={stopRecording}
              className="p-2 rounded-xl bg-error text-white hover:bg-error transition-colors"
              aria-label="Arrêter"
            >
              <Square className="w-4 h-4" fill="currentColor" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSend}
              disabled={isSending}
              className="p-2 rounded-xl bg-primary text-white hover:bg-primary-hover transition-colors disabled:opacity-50"
              aria-label="Envoyer le message vocal"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      ) : (
        /* Mic button (idle state) — no animation to prevent flickering */
        <button
          type="button"
          onClick={startRecording}
          disabled={disabled}
          className="p-2.5 rounded-xl text-text-secondary hover:text-primary-hover hover:bg-primary-10 transition-colors disabled:opacity-40"
          aria-label="Message vocal"
        >
          <Mic className="w-5 h-5" />
        </button>
      )}
    </div>
  )
})

export default VoiceRecorder
