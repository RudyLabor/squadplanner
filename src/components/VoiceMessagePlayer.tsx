"use client";

import { useState, useRef, memo, useCallback, useEffect } from 'react'
import { m } from 'framer-motion'
import { Play, Pause, Mic } from './icons'
interface VoiceMessagePlayerProps {
  voiceUrl?: string | null
  duration?: number | null
  content?: string
  isOwn?: boolean
}

export const VoiceMessagePlayer = memo(function VoiceMessagePlayer({
  voiceUrl,
  duration,
  content,
  isOwn = false,
}: VoiceMessagePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [totalDuration, setTotalDuration] = useState(duration || 0)
  const audioRef = useRef<HTMLAudioElement>(null)
  const animationRef = useRef<number>(0)

  // Extract duration from content if not provided
  useEffect(() => {
    if (!duration && content) {
      const match = content.match(/\((\d+):(\d+)\)/)
      if (match) {
        setTotalDuration(parseInt(match[1]) * 60 + parseInt(match[2]))
      }
    }
  }, [duration, content])

  const updateProgress = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
      if (!audioRef.current.paused) {
        animationRef.current = requestAnimationFrame(updateProgress)
      }
    }
  }, [])

  const togglePlay = useCallback(async () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      cancelAnimationFrame(animationRef.current)
      setIsPlaying(false)
    } else {
      try {
        await audioRef.current.play()
        setIsPlaying(true)
        animationRef.current = requestAnimationFrame(updateProgress)
      } catch (err) {
        console.error('Error playing audio:', err)
      }
    }
  }, [isPlaying, updateProgress])

  const handleEnded = useCallback(() => {
    setIsPlaying(false)
    setCurrentTime(0)
    cancelAnimationFrame(animationRef.current)
  }, [])

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current && audioRef.current.duration && isFinite(audioRef.current.duration)) {
      setTotalDuration(audioRef.current.duration)
    }
  }, [])

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !totalDuration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    const time = ratio * totalDuration
    audioRef.current.currentTime = time
    setCurrentTime(time)
  }, [totalDuration])

  useEffect(() => {
    return () => cancelAnimationFrame(animationRef.current)
  }, [])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0

  // Generate decorative waveform bars (visual representation)
  const barCount = 24
  const bars = Array.from({ length: barCount }, (_, i) => {
    const seed = (i * 7 + 13) % 17
    return 20 + (seed / 17) * 80
  })

  const hasAudio = !!voiceUrl

  return (
    <div className={`flex items-center gap-2.5 py-0.5 ${hasAudio ? '' : 'opacity-80'}`}>
      {/* Hidden audio element */}
      {voiceUrl && (
        <audio
          ref={audioRef}
          src={voiceUrl}
          preload="metadata"
          onEnded={handleEnded}
          onLoadedMetadata={handleLoadedMetadata}
        />
      )}

      {/* Play/Pause button */}
      <button
        onClick={hasAudio ? togglePlay : undefined}
        disabled={!hasAudio}
        className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
          isOwn
            ? 'bg-white/20 hover:bg-white/30 text-white'
            : 'bg-primary-15 hover:bg-primary-20 text-primary'
        } ${!hasAudio ? 'cursor-default' : ''}`}
        aria-label={isPlaying ? 'Pause' : 'Lire'}
      >
        {!hasAudio ? (
          <Mic className="w-4 h-4" />
        ) : isPlaying ? (
          <Pause className="w-4 h-4" fill="currentColor" />
        ) : (
          <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
        )}
      </button>

      {/* Waveform */}
      <div className="flex-1 min-w-0">
        <div
          className="flex items-center gap-[2px] h-6 cursor-pointer"
          onClick={hasAudio ? handleSeek : undefined}
        >
          {bars.map((height, i) => {
            const barProgress = (i / barCount) * 100
            const isPlayed = barProgress < progress

            return (
              <m.div
                key={i}
                className={`w-[3px] rounded-full transition-colors duration-150 ${
                  isPlayed
                    ? isOwn ? 'bg-white' : 'bg-primary'
                    : isOwn ? 'bg-white/30' : 'bg-text-quaternary'
                }`}
                style={{ height: `${height}%` }}
                animate={isPlaying && isPlayed ? { scaleY: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.3, repeat: isPlaying ? Infinity : 0, delay: i * 0.02 }}
              />
            )
          })}
        </div>

        {/* Time */}
        <div className="flex items-center justify-between mt-0.5">
          <span className={`text-xs ${isOwn ? 'text-white/60' : 'text-text-quaternary'}`}>
            {isPlaying || currentTime > 0 ? formatTime(currentTime) : formatTime(totalDuration)}
          </span>
          {(isPlaying || currentTime > 0) && (
            <span className={`text-xs ${isOwn ? 'text-white/60' : 'text-text-quaternary'}`}>
              {formatTime(totalDuration)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
})
