import React from 'react'
import { interpolate, spring } from 'remotion'
import { COLORS } from '../shared/colors'
import { FONTS } from '../shared/fonts'

const MEMBERS = [
  { name: 'Alex', color: '#5865f2' },
  { name: 'Kev', color: '#eb459e' },
  { name: 'Liam', color: '#4ade80' },
  { name: 'Nora', color: '#fbbf24' },
]

interface Scene3ContentProps {
  frame: number
  fps: number
}

/**
 * Scene 3 — Squad Ready / Confirmation (pure content, no PhoneFrame)
 * Renders the confirmation UI inside the unified phone.
 * frame is relative to scene 3 start.
 */
export const Scene3Content: React.FC<Scene3ContentProps> = ({ frame, fps }) => {
  const getConfirmed = () => {
    if (frame < 8) return 0
    if (frame < 20) return 1
    if (frame < 32) return 2
    if (frame < 44) return 3
    return 4
  }
  const confirmed = getConfirmed()

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column' as const,
        height: '100%',
        backgroundColor: COLORS.bg.base,
      }}
    >
      {/* App header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '6px 16px 10px 16px',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: `linear-gradient(135deg, ${COLORS.logo.primary}, ${COLORS.logo.accent})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: COLORS.logo.green,
            }}
          />
        </div>
        <div
          style={{
            color: COLORS.text.primary,
            fontSize: 17,
            fontFamily: FONTS.heading,
            fontWeight: 700,
          }}
        >
          Les Invaincus
        </div>
      </div>

      {/* Confirmation content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column' as const,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
          padding: '0 16px',
        }}
      >
        {/* Counter */}
        <div style={{ textAlign: 'center' as const }}>
          <div
            style={{
              fontSize: 80,
              fontFamily: FONTS.heading,
              fontWeight: 700,
              letterSpacing: -3,
              lineHeight: 1,
              color: COLORS.text.primary,
            }}
          >
            <span style={{ color: COLORS.success }}>{confirmed}</span>
            <span style={{ color: COLORS.text.tertiary, fontSize: 52 }}>/4</span>
          </div>
          <div
            style={{
              fontSize: 14,
              fontFamily: FONTS.body,
              fontWeight: 500,
              color: COLORS.text.secondary,
              marginTop: 6,
            }}
          >
            confirmés pour ce soir
          </div>
        </div>

        {/* Avatars */}
        <div
          style={{
            display: 'flex',
            gap: 16,
            justifyContent: 'center',
          }}
        >
          {MEMBERS.map((member, i) => {
            const delay = 5 + i * 10
            const p = spring({
              frame: frame - delay,
              fps,
              config: { damping: 12, stiffness: 200 },
            })
            const isConfirmed = i < confirmed
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: 'column' as const,
                  alignItems: 'center',
                  gap: 6,
                  opacity: p,
                  transform: `scale(${interpolate(p, [0, 1], [0.5, 1])})`,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    backgroundColor: member.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: isConfirmed
                      ? `2px solid ${COLORS.success}`
                      : '2px solid rgba(255,255,255,0.08)',
                    boxShadow: isConfirmed ? '0 0 16px rgba(52,211,153,0.3)' : 'none',
                  }}
                >
                  <span
                    style={{
                      color: 'white',
                      fontSize: 18,
                      fontFamily: FONTS.body,
                      fontWeight: 700,
                    }}
                  >
                    {member.name[0]}
                  </span>
                </div>
                <span
                  style={{
                    color: COLORS.text.tertiary,
                    fontSize: 11,
                    fontFamily: FONTS.body,
                    fontWeight: 500,
                  }}
                >
                  {member.name}
                </span>
                <div
                  style={{
                    backgroundColor: isConfirmed ? `${COLORS.success}15` : 'rgba(255,255,255,0.03)',
                    color: isConfirmed ? COLORS.success : COLORS.text.tertiary,
                    fontSize: 10,
                    fontFamily: FONTS.body,
                    fontWeight: 600,
                    padding: '3px 10px',
                    borderRadius: 6,
                    border: `1px solid ${isConfirmed ? `${COLORS.success}30` : 'rgba(255,255,255,0.06)'}`,
                  }}
                >
                  {isConfirmed ? 'Oui' : '...'}
                </div>
              </div>
            )
          })}
        </div>

        {/* Confirmation bar */}
        {confirmed >= 4 &&
          (() => {
            const confirmP = spring({
              frame: frame - 48,
              fps,
              config: { damping: 12, stiffness: 200 },
            })
            return (
              <div
                style={{
                  backgroundColor: `${COLORS.success}10`,
                  border: `1px solid ${COLORS.success}20`,
                  borderRadius: 10,
                  padding: '10px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  opacity: confirmP,
                  transform: `scale(${interpolate(confirmP, [0, 1], [0.8, 1])})`,
                }}
              >
                <span style={{ color: COLORS.success, fontSize: 14, fontWeight: 600 }}>
                  {'\u2713'}
                </span>
                <span
                  style={{
                    color: COLORS.success,
                    fontSize: 13,
                    fontFamily: FONTS.body,
                    fontWeight: 600,
                  }}
                >
                  Session confirmée
                </span>
              </div>
            )
          })()}
      </div>

      {/* Bottom nav */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          padding: '10px 0 20px 0',
          borderTop: `1px solid ${COLORS.border.subtle}`,
          flexShrink: 0,
        }}
      >
        {['Accueil', 'Squads', 'Sessions', 'Profil'].map((label, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              flexDirection: 'column' as const,
              alignItems: 'center',
              gap: 3,
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: i === 0 ? 4 : '50%',
                backgroundColor: i === 0 ? `${COLORS.primary}30` : 'rgba(255,255,255,0.06)',
              }}
            />
            <span
              style={{
                color: i === 0 ? COLORS.primary : COLORS.text.tertiary,
                fontSize: 10,
                fontFamily: FONTS.body,
                fontWeight: i === 0 ? 600 : 400,
              }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
