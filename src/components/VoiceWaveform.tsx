"use client";

import { useMemo } from 'react'
import { m } from 'framer-motion'
import { useAudioAnalyser } from '../hooks/useAudioAnalyser'

export interface VoiceWaveformProps {
  /** MediaStream from microphone input */
  audioStream?: MediaStream | null
  /** Whether the waveform should be active/animating */
  isActive: boolean
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Bar color (CSS color value) */
  color?: string
  /** Number of bars to display (default: 5) */
  barCount?: number
  /** Custom className for container */
  className?: string
}

const SIZE_CONFIG = {
  sm: {
    height: 24,
    barWidth: 3,
    gap: 2,
    minBarHeight: 4,
    maxBarHeight: 20
  },
  md: {
    height: 32,
    barWidth: 4,
    gap: 3,
    minBarHeight: 6,
    maxBarHeight: 28
  },
  lg: {
    height: 48,
    barWidth: 6,
    gap: 4,
    minBarHeight: 8,
    maxBarHeight: 44
  }
}

/**
 * VoiceWaveform - Real-time audio waveform visualization component
 *
 * Displays frequency bars that react to voice input using Web Audio API.
 * Shows different visual states for silent, speaking, and loud audio levels.
 */
export function VoiceWaveform({
  audioStream = null,
  isActive,
  size = 'md',
  color = 'var(--color-logo-green)',
  barCount = 5,
  className = ''
}: VoiceWaveformProps) {
  const { frequencyData, volumeLevel, isSpeaking } = useAudioAnalyser(
    isActive ? audioStream : null
  )

  const config = SIZE_CONFIG[size]

  // Calculate bar heights from frequency data
  const barHeights = useMemo(() => {
    if (!isActive || !audioStream) {
      // Return flat bars when inactive
      return Array(barCount).fill(config.minBarHeight)
    }

    // Map frequency bins to bar count
    const binsPerBar = Math.floor(frequencyData.length / barCount)
    const heights: number[] = []

    for (let i = 0; i < barCount; i++) {
      // Average frequency values for this bar
      let sum = 0
      for (let j = 0; j < binsPerBar; j++) {
        const idx = i * binsPerBar + j
        sum += frequencyData[idx] || 0
      }
      const avg = sum / binsPerBar

      // Map 0-255 to minBarHeight-maxBarHeight
      const normalized = avg / 255
      const height = config.minBarHeight + normalized * (config.maxBarHeight - config.minBarHeight)
      heights.push(Math.round(height))
    }

    return heights
  }, [frequencyData, isActive, audioStream, barCount, config])

  // Determine glow intensity based on volume level
  const glowIntensity = useMemo(() => {
    if (!isActive || !isSpeaking) return 0
    switch (volumeLevel) {
      case 'loud':
        return 0.6
      case 'speaking':
        return 0.3
      default:
        return 0
    }
  }, [isActive, isSpeaking, volumeLevel])

  // Container width calculation
  const containerWidth = barCount * config.barWidth + (barCount - 1) * config.gap

  return (
    <div
      className={`flex items-center justify-center ${className}`}
      style={{
        height: config.height,
        width: containerWidth
      }}
      aria-hidden="true"
    >
      <div
        className="flex items-center justify-center transition-interactive"
        style={{
          gap: config.gap,
          height: config.height,
          // Glow effect when speaking
          filter: glowIntensity > 0 ? `drop-shadow(0 0 ${8 * glowIntensity}px ${color})` : 'none'
        }}
      >
        {barHeights.map((height, index) => (
          <m.div
            key={index}
            className="rounded-full"
            style={{
              width: config.barWidth,
              backgroundColor: isActive && isSpeaking ? color : `${color}40`,
              opacity: isActive ? 1 : 0.4
            }}
            initial={{ height: config.minBarHeight }}
            animate={{
              height,
              // Add subtle glow to individual bars when loud
              boxShadow: volumeLevel === 'loud' && isActive
                ? `0 0 ${config.barWidth * 2}px ${color}`
                : 'none'
            }}
            transition={{
              height: {
                type: 'spring',
                stiffness: 300,
                damping: 20,
                mass: 0.5
              },
              boxShadow: {
                duration: 0.15
              }
            }}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * VoiceWaveformDemo - Demo component with simulated audio for testing
 * Uses CSS animations instead of real audio
 */
export function VoiceWaveformDemo({
  isActive,
  size = 'md',
  color = 'var(--color-logo-green)',
  barCount = 5,
  className = ''
}: Omit<VoiceWaveformProps, 'audioStream'>) {
  const config = SIZE_CONFIG[size]
  const containerWidth = barCount * config.barWidth + (barCount - 1) * config.gap

  return (
    <div
      className={`flex items-center justify-center ${className}`}
      style={{
        height: config.height,
        width: containerWidth
      }}
      aria-hidden="true"
    >
      <div
        className="flex items-center justify-center transition-interactive"
        style={{
          gap: config.gap,
          height: config.height,
          filter: isActive ? `drop-shadow(0 0 6px ${color})` : 'none'
        }}
      >
        {Array(barCount).fill(0).map((_, index) => (
          <m.div
            key={index}
            className="rounded-full"
            style={{
              width: config.barWidth,
              backgroundColor: isActive ? color : `${color}40`,
              opacity: isActive ? 1 : 0.4
            }}
            animate={isActive ? {
              height: [
                config.minBarHeight,
                config.minBarHeight + Math.random() * (config.maxBarHeight - config.minBarHeight),
                config.minBarHeight
              ]
            } : {
              height: config.minBarHeight
            }}
            transition={{
              duration: 0.4 + Math.random() * 0.3,
              repeat: isActive ? Infinity : 0,
              repeatType: 'reverse',
              delay: index * 0.08
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default VoiceWaveform
