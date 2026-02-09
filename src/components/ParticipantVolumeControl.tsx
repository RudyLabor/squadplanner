import { useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Volume, Volume1, Volume2, VolumeX } from 'lucide-react'
import { Tooltip } from './ui/Tooltip'

export interface ParticipantVolumeControlProps {
  participantId: string
  participantName: string
  initialVolume?: number // default 100
  onVolumeChange: (participantId: string, volume: number) => void
  onMute: (participantId: string, muted: boolean) => void
  isMuted?: boolean
  compact?: boolean
}

/**
 * Get the appropriate volume icon based on volume level
 */
function getVolumeIcon(volume: number, muted: boolean) {
  if (muted || volume === 0) return VolumeX
  if (volume < 50) return Volume
  if (volume < 100) return Volume1
  return Volume2
}

/**
 * Get slider track gradient color based on position
 * Red at 0%, Green at 100%, Orange at 200%
 */
function getTrackGradient(volume: number): string {
  if (volume <= 100) {
    // From red (0%) to green (100%)
    const percent = volume / 100
    const r = Math.round(248 - (248 - 74) * percent)
    const g = Math.round(113 + (222 - 113) * percent)
    const b = Math.round(113 + (128 - 113) * percent)
    return `rgb(${r}, ${g}, ${b})`
  } else {
    // From green (100%) to orange (200%)
    const percent = (volume - 100) / 100
    const r = Math.round(74 + (245 - 74) * percent)
    const g = Math.round(222 - (222 - 166) * percent)
    const b = Math.round(128 - (128 - 35) * percent)
    return `rgb(${r}, ${g}, ${b})`
  }
}

/**
 * Individual volume control component for voice chat participants.
 * Allows adjusting volume from 0% to 200% with visual feedback.
 */
export function ParticipantVolumeControl({
  participantId,
  participantName,
  initialVolume = 100,
  onVolumeChange,
  onMute,
  isMuted = false,
  compact = false
}: ParticipantVolumeControlProps) {
  const [volume, setVolume] = useState(initialVolume)
  const [isDragging, setIsDragging] = useState(false)
  const [previousVolume, setPreviousVolume] = useState(initialVolume)

  // Sync with external volume changes
  useEffect(() => {
    setVolume(initialVolume)
  }, [initialVolume])

  const handleVolumeChange = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(200, newVolume))
    setVolume(clampedVolume)
    onVolumeChange(participantId, clampedVolume)
  }, [participantId, onVolumeChange])

  const handleMuteToggle = useCallback(() => {
    if (isMuted) {
      // Unmute - restore previous volume
      setVolume(previousVolume)
      onVolumeChange(participantId, previousVolume)
    } else {
      // Mute - save current volume
      setPreviousVolume(volume)
    }
    onMute(participantId, !isMuted)
  }, [isMuted, volume, previousVolume, participantId, onMute, onVolumeChange])

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleVolumeChange(parseInt(e.target.value, 10))
  }, [handleVolumeChange])

  const VolumeIcon = getVolumeIcon(volume, isMuted)
  const trackColor = getTrackGradient(isMuted ? 0 : volume)
  const displayVolume = isMuted ? 0 : volume
  const fillPercent = (displayVolume / 200) * 100

  // Determine if volume is boosted (over 100%)
  const isBoosted = volume > 100 && !isMuted

  if (compact) {
    return (
      <div className="flex items-center gap-2 min-w-[140px]">
        {/* Mute button */}
        <Tooltip content={isMuted ? 'Activer le son' : 'Couper le son'} position="top" delay={300}>
          <motion.button
            onClick={handleMuteToggle}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={`
              flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center
              transition-colors duration-150
              ${isMuted
                ? 'bg-error/20 text-error'
                : 'bg-border-default text-text-secondary hover:text-text-primary hover:bg-border-hover'
              }
            `}
            aria-label={isMuted ? 'Activer le son' : 'Couper le son'}
          >
            <VolumeIcon className="w-3.5 h-3.5" />
          </motion.button>
        </Tooltip>

        {/* Compact slider */}
        <div className="relative flex-1 h-4 flex items-center">
          <div className="absolute inset-x-0 h-1.5 rounded-full bg-overlay-light overflow-hidden">
            <div
              className="h-full rounded-full transition-transform duration-100"
              style={{
                width: `${fillPercent}%`,
                backgroundColor: trackColor
              }}
            />
            {/* 100% marker */}
            <div
              className="absolute top-0 bottom-0 w-px bg-overlay-heavy"
              style={{ left: '50%' }}
            />
          </div>
          <input
            type="range"
            min="0"
            max="200"
            value={displayVolume}
            onChange={handleSliderChange}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onTouchStart={() => setIsDragging(true)}
            onTouchEnd={() => setIsDragging(false)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label={`Volume de ${participantName}`}
          />
        </div>

        {/* Volume percentage */}
        <span className={`
          flex-shrink-0 text-sm font-medium min-w-[32px] text-right tabular-nums
          ${isBoosted ? 'text-warning' : isMuted ? 'text-error' : 'text-text-secondary'}
        `}>
          {displayVolume}%
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 p-3 rounded-lg bg-surface-card border border-border-default">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className="text-base font-medium text-text-primary truncate">
          {participantName}
        </span>
        <span className={`
          text-sm font-semibold tabular-nums
          ${isBoosted ? 'text-warning' : isMuted ? 'text-error' : 'text-success'}
        `}>
          {displayVolume}%
        </span>
      </div>

      {/* Slider row */}
      <div className="flex items-center gap-3">
        {/* Mute button */}
        <Tooltip content={isMuted ? 'Activer le son' : 'Couper le son'} position="top" delay={300}>
          <motion.button
            onClick={handleMuteToggle}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={`
              flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
              transition-colors duration-150
              ${isMuted
                ? 'bg-error/20 text-error'
                : 'bg-overlay-light text-text-secondary hover:text-text-primary hover:bg-overlay-medium'
              }
            `}
            aria-label={isMuted ? 'Activer le son' : 'Couper le son'}
          >
            <VolumeIcon className="w-4 h-4" />
          </motion.button>
        </Tooltip>

        {/* Slider container */}
        <div className="relative flex-1">
          {/* Track background */}
          <div className="h-2 rounded-full bg-overlay-light overflow-hidden">
            {/* Filled track */}
            <motion.div
              className="h-full rounded-full"
              initial={false}
              animate={{
                width: `${fillPercent}%`,
                backgroundColor: trackColor
              }}
              transition={{ duration: isDragging ? 0 : 0.1 }}
            />
          </div>

          {/* 100% marker (default position) */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-overlay-heavy rounded-full pointer-events-none"
            style={{ left: '50%', transform: 'translate(-50%, -50%)' }}
          />

          {/* Thumb indicator */}
          <motion.div
            className={`
              absolute top-1/2 w-4 h-4 rounded-full
              border-2 border-bg-base shadow-lg pointer-events-none
              ${isMuted ? 'bg-error' : isBoosted ? 'bg-warning' : 'bg-success'}
            `}
            initial={false}
            animate={{
              left: `${fillPercent}%`,
              scale: isDragging ? 1.2 : 1
            }}
            transition={{ duration: isDragging ? 0 : 0.1 }}
            style={{ transform: 'translate(-50%, -50%)' }}
          />

          {/* Invisible range input */}
          <input
            type="range"
            min="0"
            max="200"
            value={displayVolume}
            onChange={handleSliderChange}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onTouchStart={() => setIsDragging(true)}
            onTouchEnd={() => setIsDragging(false)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            style={{ margin: 0 }}
            aria-label={`Volume de ${participantName}`}
          />
        </div>
      </div>

      {/* Volume labels */}
      <div className="flex justify-between text-xs text-text-tertiary px-11">
        <span>0%</span>
        <span className="text-text-secondary">100%</span>
        <span className="text-warning/70">200%</span>
      </div>
    </div>
  )
}

export default ParticipantVolumeControl
