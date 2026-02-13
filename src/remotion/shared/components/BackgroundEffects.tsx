import React from 'react'
import { AbsoluteFill, interpolate } from 'remotion'

// 30 floating particles
const PARTICLES = Array.from({ length: 30 }, (_, i) => ({
  x: (i * 137.5 + 12) % 100,
  baseY: (i * 97.3 + 8) % 100,
  size: 2 + (i % 4) * 1.2,
  phase: i * 0.65,
  speed: 0.01 + (i % 6) * 0.003,
  layer: i % 3,
}))

// 6 orbital radial lines
const ORBITALS = Array.from({ length: 6 }, (_, i) => ({
  angle: i * 60 + 15,
  length: 300 + (i % 3) * 120,
  speed: 0.004 + (i % 3) * 0.002,
  phase: i * 1.2,
  thickness: i % 2 === 0 ? 1 : 0.5,
}))

// Hexagonal grid nodes — precomputed positions
const HEX_SIZE = 60
const HEX_COLS = 8
const HEX_ROWS = 5
const HEXAGONS = Array.from({ length: HEX_COLS * HEX_ROWS }, (_, i) => {
  const col = i % HEX_COLS
  const row = Math.floor(i / HEX_COLS)
  const offsetX = row % 2 === 0 ? 0 : HEX_SIZE * 0.866
  return {
    x: 360 + col * HEX_SIZE * 1.732 + offsetX,
    y: 180 + row * HEX_SIZE * 1.5,
    phase: i * 0.45,
    pulseSpeed: 0.015 + (i % 5) * 0.004,
  }
})

// Generate SVG path for a regular hexagon
function hexPath(cx: number, cy: number, size: number): string {
  const points: string[] = []
  for (let k = 0; k < 6; k++) {
    const angle = (Math.PI / 3) * k - Math.PI / 6
    points.push(`${cx + size * Math.cos(angle)},${cy + size * Math.sin(angle)}`)
  }
  return `M${points.join('L')}Z`
}

// 12 radial light streaks for transitions
const LIGHT_STREAKS = Array.from({ length: 12 }, (_, i) => ({
  angle: i * 30 + 15,
  length: 600 + (i % 3) * 200,
  width: 2 + (i % 4) * 0.8,
  phase: i * 0.8,
}))

// Constellation edges — connect nearby particles
function getConstellationEdges(
  particles: typeof PARTICLES,
  frame: number
): { x1: number; y1: number; x2: number; y2: number; opacity: number }[] {
  const edges: {
    x1: number
    y1: number
    x2: number
    y2: number
    opacity: number
  }[] = []
  const threshold = 22 // percentage distance threshold

  for (let i = 0; i < particles.length; i++) {
    const p1 = particles[i]
    const p1y =
      p1.baseY +
      Math.sin(frame * p1.speed + p1.phase) *
        4 *
        (p1.layer === 0 ? 1.8 : p1.layer === 1 ? 1.2 : 0.6)
    for (let j = i + 1; j < particles.length; j++) {
      const p2 = particles[j]
      const p2y =
        p2.baseY +
        Math.sin(frame * p2.speed + p2.phase) *
          4 *
          (p2.layer === 0 ? 1.8 : p2.layer === 1 ? 1.2 : 0.6)
      const dx = p1.x - p2.x
      const dy = p1y - p2y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < threshold && p1.layer === p2.layer) {
        const opacity = (1 - dist / threshold) * 0.15
        edges.push({
          x1: (p1.x / 100) * 1920,
          y1: (p1y / 100) * 1080,
          x2: (p2.x / 100) * 1920,
          y2: (p2y / 100) * 1080,
          opacity,
        })
      }
    }
  }
  return edges
}

interface BackgroundEffectsProps {
  frame: number
  glowColor1: string
  glowColor2: string
  intensity?: number
  gridColor?: string
  gridOpacity?: number
  particleColor?: string
  /** 0-1, controls anamorphic lens flare intensity */
  flareIntensity?: number
  /** 0-1, controls radial light streak burst intensity during transitions */
  streakIntensity?: number
  /** 0-1, progressive depth-of-field blur on background elements */
  dofBlur?: number
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16) || 0
  const g = parseInt(h.substring(2, 4), 16) || 0
  const b = parseInt(h.substring(4, 6), 16) || 0
  return `rgba(${r},${g},${b},${alpha})`
}

export const BackgroundEffects: React.FC<BackgroundEffectsProps> = ({
  frame,
  glowColor1,
  glowColor2,
  intensity = 1,
  gridColor,
  gridOpacity = 0.25,
  particleColor,
  flareIntensity = 0,
  streakIntensity = 0,
  dofBlur = 0,
}) => {
  const gc = gridColor || glowColor1
  const pc = particleColor || glowColor1
  const pulse = Math.sin(frame * 0.03) * 0.5 + 0.5
  const cx = 960
  const cy = 520

  const constellationEdges = getConstellationEdges(PARTICLES, frame)

  return (
    <>
      {/* === MESH GRADIENT — triple radial === */}
      <AbsoluteFill
        style={{
          background: `
            radial-gradient(ellipse 80% 65% at 35% 30%, ${hexToRgba(glowColor1, interpolate(pulse, [0, 1], [0.1, 0.22]) * intensity)} 0%, transparent 60%),
            radial-gradient(ellipse 65% 55% at 65% 70%, ${hexToRgba(glowColor2, interpolate(pulse, [0, 1], [0.08, 0.16]) * intensity)} 0%, transparent 55%),
            radial-gradient(ellipse 50% 40% at 50% 48%, ${hexToRgba(glowColor1, interpolate(pulse, [0, 1], [0.04, 0.1]) * intensity)} 0%, transparent 50%)
          `,
          pointerEvents: 'none' as const,
        }}
      />

      {/* === VOLUMETRIC LIGHT BEAMS — 2 slow-sweeping angled shafts === */}
      <AbsoluteFill
        style={{
          overflow: 'hidden' as const,
          pointerEvents: 'none' as const,
          opacity: 0.35 * intensity,
        }}
      >
        {[0, 1].map((i) => {
          const beamAngle = -25 + i * 50
          const beamX = 50 + Math.sin(frame * (i === 0 ? 0.006 : -0.005) + i * 2) * 20
          const beamOpacity = 0.06 + Math.sin(frame * 0.02 + i * 3) * 0.03
          return (
            <div
              key={`beam-${i}`}
              style={{
                position: 'absolute' as const,
                top: '-20%',
                left: `${beamX}%`,
                width: 180,
                height: '140%',
                background: `linear-gradient(180deg, ${hexToRgba(gc, beamOpacity)}, transparent 70%)`,
                transform: `translateX(-50%) rotate(${beamAngle}deg)`,
                transformOrigin: 'top center',
                filter: 'blur(40px)',
              }}
            />
          )
        })}
      </AbsoluteFill>

      {/* === DOT GRID === */}
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(circle, ${hexToRgba(gc, 0.35)} 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 48%, black 15%, transparent 55%)',
          maskImage: 'radial-gradient(ellipse at 50% 48%, black 15%, transparent 55%)',
          opacity: gridOpacity * intensity * 1.8,
          pointerEvents: 'none' as const,
        }}
      />

      {/* === SVG LAYER: orbitals + constellation + bloom rings === */}
      <svg
        width="1920"
        height="1080"
        viewBox="0 0 1920 1080"
        style={{
          position: 'absolute' as const,
          top: 0,
          left: 0,
          pointerEvents: 'none' as const,
          opacity: 0.5 * intensity,
        }}
      >
        <defs>
          {/* Glow filter for bloom effect on orbital dots */}
          <filter id="bloom" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
          </filter>
        </defs>

        {/* Radial orbital lines */}
        {ORBITALS.map((orb, i) => {
          const currentAngle =
            (orb.angle + frame * orb.speed * 57.3 + Math.sin(frame * 0.02 + orb.phase) * 8) *
            (Math.PI / 180)
          const endX = cx + Math.cos(currentAngle) * orb.length
          const endY = cy + Math.sin(currentAngle) * orb.length
          const lineOpacity = 0.12 + Math.sin(frame * 0.04 + orb.phase) * 0.08

          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={endX}
              y2={endY}
              stroke={hexToRgba(gc, lineOpacity)}
              strokeWidth={orb.thickness}
              strokeLinecap="round"
            />
          )
        })}

        {/* Orbital rings — dashed ellipses */}
        {[280, 420].map((radius, i) => {
          const ringAngle = frame * (i === 0 ? 0.003 : -0.002) * 57.3
          return (
            <ellipse
              key={`ring-${i}`}
              cx={cx}
              cy={cy}
              rx={radius}
              ry={radius * 0.6}
              fill="none"
              stroke={hexToRgba(gc, 0.06 + Math.sin(frame * 0.025 + i * 2) * 0.03)}
              strokeWidth={0.8}
              strokeDasharray="8 16"
              transform={`rotate(${ringAngle} ${cx} ${cy})`}
            />
          )
        })}

        {/* Orbital traveling dots — with bloom glow */}
        {[0, 1, 2, 3].map((i) => {
          const radius = i < 2 ? 280 : 420
          const speed = i < 2 ? 0.015 : -0.01
          const angle = frame * speed + i * (Math.PI / 2)
          const dotX = cx + Math.cos(angle) * radius
          const dotY = cy + Math.sin(angle) * radius * 0.6
          const dotOpacity = 0.25 + Math.sin(frame * 0.05 + i * 1.5) * 0.12

          return (
            <React.Fragment key={`dot-${i}`}>
              {/* Bloom layer */}
              <circle
                cx={dotX}
                cy={dotY}
                r={6}
                fill={hexToRgba(gc, dotOpacity * 0.4)}
                filter="url(#bloom)"
              />
              {/* Sharp dot */}
              <circle cx={dotX} cy={dotY} r={2.5} fill={hexToRgba(gc, dotOpacity)} />
            </React.Fragment>
          )
        })}

        {/* === CONSTELLATION CONNECTIONS === */}
        {constellationEdges.map((edge, i) => (
          <line
            key={`const-${i}`}
            x1={edge.x1}
            y1={edge.y1}
            x2={edge.x2}
            y2={edge.y2}
            stroke={hexToRgba(gc, edge.opacity)}
            strokeWidth={0.5}
            strokeLinecap="round"
          />
        ))}

        {/* === EDGE BLOOM RINGS — pulsing rings from center === */}
        {[0, 1, 2].map((i) => {
          const ringRadius = 150 + i * 140 + Math.sin(frame * 0.015 + i * 1.5) * 30
          const ringOpacity = 0.03 + Math.sin(frame * 0.02 + i * 2.5) * 0.015
          return (
            <circle
              key={`bloom-ring-${i}`}
              cx={cx}
              cy={cy}
              r={ringRadius}
              fill="none"
              stroke={hexToRgba(gc, ringOpacity)}
              strokeWidth={1.5}
            />
          )
        })}

        {/* === HEXAGONAL GRID NODES === */}
        {HEXAGONS.map((hex, i) => {
          const hexPulse = 0.04 + Math.sin(frame * hex.pulseSpeed + hex.phase) * 0.03
          const hexScale = 1 + Math.sin(frame * 0.02 + hex.phase) * 0.08
          const glowPulse = Math.sin(frame * hex.pulseSpeed * 1.5 + hex.phase) * 0.5 + 0.5
          const size = HEX_SIZE * 0.35 * hexScale

          return (
            <React.Fragment key={`hex-${i}`}>
              {/* Hexagon outline */}
              <path
                d={hexPath(hex.x, hex.y, size)}
                fill="none"
                stroke={hexToRgba(gc, hexPulse)}
                strokeWidth={0.6}
              />
              {/* Corner dots on alternating hexagons */}
              {i % 3 === 0 &&
                [0, 2, 4].map((k) => {
                  const angle = (Math.PI / 3) * k - Math.PI / 6
                  const dotX = hex.x + size * Math.cos(angle)
                  const dotY = hex.y + size * Math.sin(angle)
                  return (
                    <circle
                      key={`hex-dot-${i}-${k}`}
                      cx={dotX}
                      cy={dotY}
                      r={1.5}
                      fill={hexToRgba(gc, hexPulse * 2)}
                    />
                  )
                })}
              {/* Glow fill on some hexagons */}
              {i % 7 === 0 && (
                <path
                  d={hexPath(hex.x, hex.y, size * 0.6)}
                  fill={hexToRgba(gc, glowPulse * 0.03)}
                  stroke="none"
                />
              )}
            </React.Fragment>
          )
        })}

        {/* === HEXAGON CONNECTIONS — lines between adjacent hexagons === */}
        {HEXAGONS.map((hex, i) => {
          if (i % 4 !== 0) return null
          // Connect to nearest neighbor
          const neighbor = HEXAGONS[i + 1]
          if (!neighbor) return null
          const dx = neighbor.x - hex.x
          const dy = neighbor.y - hex.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist > HEX_SIZE * 2.5) return null
          const connOpacity = 0.03 + Math.sin(frame * 0.025 + hex.phase) * 0.02
          return (
            <line
              key={`hex-conn-${i}`}
              x1={hex.x}
              y1={hex.y}
              x2={neighbor.x}
              y2={neighbor.y}
              stroke={hexToRgba(gc, connOpacity)}
              strokeWidth={0.4}
              strokeDasharray="4 8"
            />
          )
        })}
      </svg>

      {/* === ANAMORPHIC LENS FLARE === */}
      {flareIntensity > 0 && (
        <AbsoluteFill
          style={{
            pointerEvents: 'none' as const,
            opacity: flareIntensity,
          }}
        >
          {/* Horizontal streak */}
          <div
            style={{
              position: 'absolute' as const,
              top: '47%',
              left: '10%',
              right: '10%',
              height: 2,
              background: `linear-gradient(90deg, transparent 0%, ${hexToRgba(gc, 0.4)} 30%, ${hexToRgba(gc, 0.8)} 50%, ${hexToRgba(gc, 0.4)} 70%, transparent 100%)`,
              filter: 'blur(3px)',
            }}
          />
          {/* Wide soft horizontal glow */}
          <div
            style={{
              position: 'absolute' as const,
              top: '44%',
              left: '5%',
              right: '5%',
              height: 50,
              background: `linear-gradient(90deg, transparent 5%, ${hexToRgba(gc, 0.08)} 25%, ${hexToRgba(gc, 0.15)} 50%, ${hexToRgba(gc, 0.08)} 75%, transparent 95%)`,
              filter: 'blur(20px)',
            }}
          />
          {/* Small flare orbs */}
          {[-200, -80, 120, 250].map((offset, i) => (
            <div
              key={`flare-orb-${i}`}
              style={{
                position: 'absolute' as const,
                top: '47%',
                left: `${50 + (offset / 960) * 50}%`,
                width: 8 + i * 3,
                height: 8 + i * 3,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${hexToRgba(gc, 0.3)} 0%, transparent 70%)`,
                transform: 'translate(-50%, -50%)',
                filter: 'blur(2px)',
              }}
            />
          ))}
        </AbsoluteFill>
      )}

      {/* === RADIAL LIGHT STREAKS — transition bursts === */}
      {streakIntensity > 0 && (
        <AbsoluteFill
          style={{
            pointerEvents: 'none' as const,
            opacity: streakIntensity,
          }}
        >
          {LIGHT_STREAKS.map((streak, i) => {
            const angle = streak.angle + Math.sin(frame * 0.008 + streak.phase) * 3
            const rad = (angle * Math.PI) / 180
            const streakLen = streak.length * (0.8 + streakIntensity * 0.4)
            const endX = 960 + Math.cos(rad) * streakLen
            const endY = 520 + Math.sin(rad) * streakLen
            const streakOpacity = 0.12 + Math.sin(frame * 0.04 + streak.phase) * 0.06

            return (
              <svg
                key={`streak-${i}`}
                width="1920"
                height="1080"
                viewBox="0 0 1920 1080"
                style={{
                  position: 'absolute' as const,
                  top: 0,
                  left: 0,
                }}
              >
                <defs>
                  <linearGradient
                    id={`streak-grad-${i}`}
                    x1={960}
                    y1={520}
                    x2={endX}
                    y2={endY}
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop offset="0%" stopColor={gc} stopOpacity={streakOpacity * 0.8} />
                    <stop offset="40%" stopColor={gc} stopOpacity={streakOpacity * 0.3} />
                    <stop offset="100%" stopColor={gc} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <line
                  x1={960}
                  y1={520}
                  x2={endX}
                  y2={endY}
                  stroke={`url(#streak-grad-${i})`}
                  strokeWidth={streak.width}
                  strokeLinecap="round"
                />
              </svg>
            )
          })}
          {/* Central glow burst */}
          <div
            style={{
              position: 'absolute' as const,
              top: '48%',
              left: '50%',
              width: 300 * streakIntensity,
              height: 300 * streakIntensity,
              transform: 'translate(-50%, -50%)',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${hexToRgba(gc, 0.2)} 0%, ${hexToRgba(gc, 0.05)} 40%, transparent 70%)`,
              filter: 'blur(15px)',
            }}
          />
        </AbsoluteFill>
      )}

      {/* === DEPTH-OF-FIELD BLUR OVERLAY === */}
      {dofBlur > 0 && (
        <AbsoluteFill
          style={{
            pointerEvents: 'none' as const,
            backdropFilter: `blur(${dofBlur * 6}px)`,
            WebkitBackdropFilter: `blur(${dofBlur * 6}px)`,
            WebkitMaskImage:
              'radial-gradient(ellipse 60% 50% at 50% 48%, transparent 25%, black 70%)',
            maskImage: 'radial-gradient(ellipse 60% 50% at 50% 48%, transparent 25%, black 70%)',
            opacity: dofBlur,
          }}
        />
      )}

      {/* === FLOATING PARTICLES with glow === */}
      {PARTICLES.map((p, i) => {
        const parallaxMultiplier = p.layer === 0 ? 1.8 : p.layer === 1 ? 1.2 : 0.6
        const yOffset = Math.sin(frame * p.speed + p.phase) * 4 * parallaxMultiplier
        const particleOpacity =
          (0.08 + Math.sin(frame * 0.02 + p.phase) * 0.04) *
          intensity *
          (p.layer === 0 ? 1.5 : p.layer === 1 ? 1 : 0.6)
        const sz = p.size * (p.layer === 0 ? 1.5 : p.layer === 1 ? 1.1 : 0.8)

        return (
          <div
            key={i}
            style={{
              position: 'absolute' as const,
              left: `${p.x}%`,
              top: `${p.baseY + yOffset}%`,
              width: sz,
              height: sz,
              borderRadius: '50%',
              backgroundColor: i % 3 === 0 ? pc : hexToRgba(pc, 0.7),
              opacity: particleOpacity,
              boxShadow: p.layer === 0 ? `0 0 ${sz * 3}px ${hexToRgba(pc, 0.15)}` : 'none',
              pointerEvents: 'none' as const,
            }}
          />
        )
      })}

      {/* === VIGNETTE — cinematic depth === */}
      <AbsoluteFill
        style={{
          background: 'radial-gradient(ellipse at 50% 48%, transparent 40%, rgba(0,0,0,0.4) 100%)',
          pointerEvents: 'none' as const,
          opacity: intensity,
        }}
      />
    </>
  )
}
