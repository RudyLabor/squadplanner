import React from 'react'
import { interpolate, spring } from 'remotion'
import { COLORS } from '../shared/colors'
import { FONTS } from '../shared/fonts'

const MEMBERS = [
  { name: 'Alex', color: '#5865f2' },
  { name: 'Kev', color: '#eb459e' },
  { name: 'Liam', color: '#4ade80' },
  { name: 'Nora', color: '#fbbf24' },
  { name: 'Max', color: '#06B6D4' },
]

interface Scene2ContentProps {
  frame: number
  fps: number
}

/**
 * Scene 2 — Squad Planner UI (pure content, no PhoneFrame)
 * Renders the SP app interface inside the unified phone.
 * frame is relative to scene 2 start (0 = first frame of scene 2).
 */
export const Scene2Content: React.FC<Scene2ContentProps> = ({ frame, fps }) => {
  const headerP = spring({
    frame: frame - 10,
    fps,
    config: { damping: 200 },
  })
  const sessionP = spring({
    frame: frame - 23,
    fps,
    config: { damping: 12, stiffness: 180 },
  })
  const navP = spring({
    frame: frame - 17,
    fps,
    config: { damping: 200 },
  })

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
          opacity: headerP,
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
        <div>
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
          <div
            style={{
              color: COLORS.text.tertiary,
              fontSize: 12,
              fontFamily: FONTS.body,
              fontWeight: 400,
            }}
          >
            5 membres
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          padding: '0 14px',
          display: 'flex',
          flexDirection: 'column' as const,
          gap: 12,
        }}
      >
        {/* Session card */}
        <div
          style={{
            backgroundColor: COLORS.bg.surface,
            borderRadius: 14,
            padding: '16px 14px',
            border: `1px solid ${COLORS.border.default}`,
            opacity: sessionP,
            transform: `translateY(${interpolate(sessionP, [0, 1], [10, 0])}px)`,
          }}
        >
          <div
            style={{
              backgroundColor: `${COLORS.primary}20`,
              color: COLORS.primary,
              fontSize: 10,
              fontFamily: FONTS.body,
              fontWeight: 600,
              padding: '3px 8px',
              borderRadius: 4,
              textTransform: 'uppercase' as const,
              letterSpacing: 0.5,
              display: 'inline-block',
              marginBottom: 8,
            }}
          >
            Prochaine session
          </div>
          <div
            style={{
              color: COLORS.text.primary,
              fontSize: 18,
              fontFamily: FONTS.heading,
              fontWeight: 700,
              marginBottom: 4,
            }}
          >
            Ranked Valorant
          </div>
          <div
            style={{
              color: COLORS.text.secondary,
              fontSize: 13,
              fontFamily: FONTS.body,
              fontWeight: 400,
              marginBottom: 12,
            }}
          >
            Vendredi 21h
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {MEMBERS.slice(0, 4).map((m, i) => (
              <div
                key={i}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  backgroundColor: m.color,
                  border: `2px solid ${COLORS.bg.surface}`,
                  marginLeft: i > 0 ? -6 : 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 5 - i,
                }}
              >
                <span
                  style={{
                    color: 'white',
                    fontSize: 10,
                    fontFamily: FONTS.body,
                    fontWeight: 700,
                  }}
                >
                  {m.name[0]}
                </span>
              </div>
            ))}
            <span
              style={{
                color: COLORS.text.tertiary,
                fontSize: 12,
                fontFamily: FONTS.body,
                fontWeight: 500,
                marginLeft: 8,
              }}
            >
              En attente...
            </span>
          </div>
        </div>

        {/* Voice */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 14px',
            backgroundColor: `${COLORS.success}08`,
            borderRadius: 10,
            border: `1px solid ${COLORS.success}20`,
            opacity: sessionP,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: COLORS.success,
            }}
          />
          <span
            style={{
              color: COLORS.success,
              fontSize: 13,
              fontFamily: FONTS.body,
              fontWeight: 500,
            }}
          >
            Party vocale disponible
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, opacity: sessionP }}>
          {[
            { label: 'Proposer', color: COLORS.primary },
            { label: 'Inviter', color: COLORS.secondary },
          ].map((a, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                padding: '10px 0',
                borderRadius: 10,
                backgroundColor: `${a.color}15`,
                border: `1px solid ${a.color}25`,
                textAlign: 'center' as const,
              }}
            >
              <span
                style={{
                  color: a.color,
                  fontSize: 13,
                  fontFamily: FONTS.body,
                  fontWeight: 600,
                }}
              >
                {a.label}
              </span>
            </div>
          ))}
        </div>
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
          opacity: navP,
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
