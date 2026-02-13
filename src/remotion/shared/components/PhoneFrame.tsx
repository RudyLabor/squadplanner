import React from 'react'

const PHONE_WIDTH = 360
const PHONE_HEIGHT = 740
const BEZEL = 6
const BORDER_RADIUS = 50
const SCREEN_RADIUS = 44
const NOTCH_WIDTH = 110
const NOTCH_HEIGHT = 30

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16) || 0
  const g = parseInt(h.substring(2, 4), 16) || 0
  const b = parseInt(h.substring(4, 6), 16) || 0
  return `rgba(${r},${g},${b},${alpha})`
}

interface PhoneFrameProps {
  children: React.ReactNode
  scale?: number
  rotateY?: number
  rotateX?: number
  glowColor?: string
  glowIntensity?: number
  reflectionProgress?: number
  floatOffset?: number
  /** Shadow color tinting — defaults to glowColor */
  shadowColor?: string
}

export const PhoneFrame: React.FC<PhoneFrameProps> = ({
  children,
  scale = 1,
  rotateY = 0,
  rotateX = 0,
  glowColor = '#6366f1',
  glowIntensity = 0.15,
  reflectionProgress = -1,
  floatOffset = 0,
  shadowColor,
}) => {
  const sc = shadowColor || glowColor

  // Edge lighting reacts to rotation — brighter on the edge facing viewer
  const leftEdgeOpacity = Math.max(0, Math.min(0.35, 0.08 + rotateY * 0.03))
  const rightEdgeOpacity = Math.max(0, Math.min(0.35, 0.08 - rotateY * 0.03))
  const topEdgeOpacity = Math.max(0, Math.min(0.3, 0.12 + rotateX * 0.02))

  return (
    <div
      style={{
        position: 'relative' as const,
        width: PHONE_WIDTH,
        height: PHONE_HEIGHT,
        transform: `scale(${scale}) perspective(1200px) rotateY(${rotateY}deg) rotateX(${rotateX}deg) translateY(${floatOffset}px)`,
        transformStyle: 'preserve-3d' as const,
      }}
    >
      {/* === TRIPLE-LAYER SHADOWS === */}

      {/* Layer 1: Close shadow — sharp, small offset */}
      <div
        style={{
          position: 'absolute' as const,
          top: 15,
          left: 15,
          right: 15,
          bottom: -10,
          borderRadius: BORDER_RADIUS,
          background: hexToRgba(sc, 0.3),
          filter: 'blur(15px)',
          pointerEvents: 'none' as const,
          zIndex: -3,
        }}
      />

      {/* Layer 2: Medium shadow — larger spread */}
      <div
        style={{
          position: 'absolute' as const,
          top: 40,
          left: 30,
          right: 30,
          bottom: -30,
          borderRadius: BORDER_RADIUS,
          background: hexToRgba(sc, 0.2),
          filter: 'blur(40px)',
          pointerEvents: 'none' as const,
          zIndex: -2,
        }}
      />

      {/* Layer 3: Far shadow — massive diffused ambient */}
      <div
        style={{
          position: 'absolute' as const,
          top: 60,
          left: 50,
          right: 50,
          bottom: -50,
          borderRadius: BORDER_RADIUS,
          background: 'rgba(0,0,0,0.6)',
          filter: 'blur(70px)',
          pointerEvents: 'none' as const,
          zIndex: -1,
        }}
      />

      {/* Ambient glow behind phone — color-tinted */}
      <div
        style={{
          position: 'absolute' as const,
          top: -120,
          left: -120,
          right: -120,
          bottom: -120,
          borderRadius: BORDER_RADIUS + 100,
          background: `radial-gradient(ellipse, ${hexToRgba(glowColor, glowIntensity)} 0%, ${hexToRgba(glowColor, glowIntensity * 0.3)} 40%, transparent 70%)`,
          pointerEvents: 'none' as const,
          zIndex: -4,
        }}
      />

      {/* Phone body — titanium gradient */}
      <div
        style={{
          width: PHONE_WIDTH,
          height: PHONE_HEIGHT,
          borderRadius: BORDER_RADIUS,
          background: 'linear-gradient(160deg, #2a2a3d 0%, #151520 50%, #1a1a2e 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
          padding: BEZEL,
          boxSizing: 'border-box' as const,
          position: 'relative' as const,
        }}
      >
        {/* === EDGE LIGHTING — reactive to rotation === */}

        {/* Top edge highlight */}
        <div
          style={{
            position: 'absolute' as const,
            top: 0,
            left: BORDER_RADIUS,
            right: BORDER_RADIUS,
            height: 1,
            background: `linear-gradient(90deg, transparent, ${hexToRgba(glowColor, topEdgeOpacity)}, transparent)`,
            zIndex: 2,
          }}
        />

        {/* Left edge highlight */}
        <div
          style={{
            position: 'absolute' as const,
            left: 0,
            top: BORDER_RADIUS,
            bottom: BORDER_RADIUS,
            width: 1,
            background: `linear-gradient(180deg, transparent, ${hexToRgba(glowColor, leftEdgeOpacity)}, transparent)`,
            zIndex: 2,
          }}
        />

        {/* Right edge highlight */}
        <div
          style={{
            position: 'absolute' as const,
            right: 0,
            top: BORDER_RADIUS,
            bottom: BORDER_RADIUS,
            width: 1,
            background: `linear-gradient(180deg, transparent, ${hexToRgba(glowColor, rightEdgeOpacity)}, transparent)`,
            zIndex: 2,
          }}
        />

        {/* Bottom edge highlight — subtle */}
        <div
          style={{
            position: 'absolute' as const,
            bottom: 0,
            left: BORDER_RADIUS,
            right: BORDER_RADIUS,
            height: 1,
            background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)`,
            zIndex: 2,
          }}
        />

        {/* Screen */}
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: SCREEN_RADIUS,
            overflow: 'hidden',
            position: 'relative' as const,
            backgroundColor: '#000',
          }}
        >
          {/* Content */}
          <div
            style={{
              width: '100%',
              height: '100%',
              position: 'relative' as const,
              display: 'flex',
              flexDirection: 'column' as const,
            }}
          >
            {children}
          </div>

          {/* Dynamic Island */}
          <div
            style={{
              position: 'absolute' as const,
              top: 10,
              left: '50%',
              transform: 'translateX(-50%)',
              width: NOTCH_WIDTH,
              height: NOTCH_HEIGHT,
              borderRadius: NOTCH_HEIGHT / 2,
              backgroundColor: '#000',
              zIndex: 10,
              boxShadow: '0 0 0 1px rgba(255,255,255,0.05)',
            }}
          />

          {/* Glass reflection sweep */}
          {reflectionProgress >= 0 && reflectionProgress <= 1 && (
            <div
              style={{
                position: 'absolute' as const,
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `linear-gradient(
                  125deg,
                  transparent ${reflectionProgress * 130 - 30}%,
                  rgba(255,255,255,0.02) ${reflectionProgress * 130 - 15}%,
                  rgba(255,255,255,0.07) ${reflectionProgress * 130}%,
                  rgba(255,255,255,0.02) ${reflectionProgress * 130 + 15}%,
                  transparent ${reflectionProgress * 130 + 30}%
                )`,
                zIndex: 8,
                pointerEvents: 'none' as const,
              }}
            />
          )}

          {/* Persistent subtle glass reflection — top-left corner */}
          <div
            style={{
              position: 'absolute' as const,
              top: 0,
              left: 0,
              right: 0,
              height: '35%',
              background: 'linear-gradient(175deg, rgba(255,255,255,0.03) 0%, transparent 50%)',
              pointerEvents: 'none' as const,
              zIndex: 7,
            }}
          />

          {/* Screen inner border */}
          <div
            style={{
              position: 'absolute' as const,
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: SCREEN_RADIUS,
              border: '1px solid rgba(255,255,255,0.04)',
              pointerEvents: 'none' as const,
              zIndex: 9,
            }}
          />
        </div>
      </div>

      {/* Side buttons */}
      <div
        style={{
          position: 'absolute' as const,
          right: -2,
          top: 200,
          width: 3,
          height: 70,
          borderRadius: '0 2px 2px 0',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.1), rgba(255,255,255,0.04))',
        }}
      />
      <div
        style={{
          position: 'absolute' as const,
          left: -2,
          top: 170,
          width: 3,
          height: 36,
          borderRadius: '2px 0 0 2px',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.1), rgba(255,255,255,0.04))',
        }}
      />
      <div
        style={{
          position: 'absolute' as const,
          left: -2,
          top: 218,
          width: 3,
          height: 36,
          borderRadius: '2px 0 0 2px',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.1), rgba(255,255,255,0.04))',
        }}
      />
    </div>
  )
}
