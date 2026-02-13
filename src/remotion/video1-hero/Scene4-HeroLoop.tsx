import React from 'react'
import { interpolate, spring } from 'remotion'
import { COLORS } from '../shared/colors'
import { FONTS } from '../shared/fonts'

interface Scene4ContentProps {
  frame: number
  fps: number
}

/**
 * Scene 4 — Logo + Tagline finale (pas de phone)
 * Ce contenu est affiché en overlay par HeroVideo quand le phone scale down.
 * frame est relatif au début de la scène 4.
 */
export const Scene4Content: React.FC<Scene4ContentProps> = ({ frame, fps }) => {
  const logoProgress = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 100 },
  })
  const nameProgress = spring({
    frame: frame - 10,
    fps,
    config: { damping: 200 },
  })
  const taglineProgress = spring({
    frame: frame - 20,
    fps,
    config: { damping: 200 },
  })

  const glowPulse = Math.sin(frame * 0.07) * 0.5 + 0.5

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        gap: 28,
      }}
    >
      {/* Logo — 200x200 */}
      <div
        style={{
          opacity: logoProgress,
          transform: `scale(${interpolate(logoProgress, [0, 1], [0.4, 1])})`,
        }}
      >
        <div style={{ position: 'relative' as const, width: 200, height: 200 }}>
          <div
            style={{
              position: 'absolute' as const,
              top: -60,
              left: -60,
              right: -60,
              bottom: -60,
              borderRadius: '50%',
              background: `radial-gradient(circle, rgba(99,102,241,${interpolate(glowPulse, [0, 1], [0.25, 0.45])}) 0%, rgba(139,147,255,${interpolate(glowPulse, [0, 1], [0.1, 0.2])}) 35%, transparent 65%)`,
            }}
          />
          <div
            style={{
              position: 'absolute' as const,
              top: -30,
              left: -30,
              right: -30,
              bottom: -30,
              borderRadius: '50%',
              background: `radial-gradient(circle at 60% 60%, rgba(74,222,128,${interpolate(glowPulse, [0, 1], [0.05, 0.12])}) 0%, transparent 60%)`,
            }}
          />
          <svg width="200" height="200" viewBox="0 0 32 32" fill="none">
            <path
              d="M5 5 L27 5 L27 27 L5 27 Z"
              stroke={COLORS.logo.primary}
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              opacity="0.5"
            />
            <path
              d="M5 5 L16 16 M27 5 L16 16 M5 27 L16 16 M27 27 L16 16"
              stroke={COLORS.logo.accent}
              strokeWidth="0.7"
              strokeLinecap="round"
              opacity="0.4"
            />
            <circle cx="5" cy="5" r="3.2" fill={COLORS.logo.primary} />
            <circle cx="27" cy="5" r="3.2" fill={COLORS.logo.accent} />
            <circle cx="5" cy="27" r="3.2" fill={COLORS.logo.accent} />
            <circle cx="27" cy="27" r="3.2" fill={COLORS.logo.green} />
            <circle cx="16" cy="16" r="3.2" fill={COLORS.logo.green} />
          </svg>
        </div>
      </div>

      {/* App name */}
      <div
        style={{
          opacity: nameProgress,
          transform: `translateY(${interpolate(nameProgress, [0, 1], [12, 0])}px)`,
        }}
      >
        <span
          style={{
            color: COLORS.text.primary,
            fontSize: 42,
            fontFamily: FONTS.heading,
            fontWeight: 700,
            letterSpacing: -1.5,
          }}
        >
          Squad Planner
        </span>
      </div>

      {/* Tagline */}
      <div
        style={{
          opacity: taglineProgress,
          transform: `translateY(${interpolate(taglineProgress, [0, 1], [15, 0])}px)`,
        }}
      >
        <span
          style={{
            color: COLORS.text.primary,
            fontSize: 64,
            fontFamily: FONTS.heading,
            fontWeight: 700,
            letterSpacing: -3,
            textAlign: 'center' as const,
            display: 'block',
          }}
        >
          Fini les{' '}
          <span style={{ color: COLORS.primary }}>
            {'\u00AB'} on verra {'\u00BB'}
          </span>
        </span>
      </div>
    </div>
  )
}
