import React from 'react'
import { interpolate, spring, Easing } from 'remotion'
import { DISCORD_COLORS } from '../shared/colors'
import { FONTS } from '../shared/fonts'

const MESSAGES = [
  { author: 'Alex', text: 'on joue ce soir ?', color: DISCORD_COLORS.avatarColors[0] },
  { author: 'Kev', text: 'je sais pas', color: DISCORD_COLORS.avatarColors[1] },
  { author: 'Liam', text: 'on verra', color: DISCORD_COLORS.avatarColors[3] },
  { author: 'Nora', text: 'peut-être demain...', color: DISCORD_COLORS.avatarColors[2] },
]

interface Scene1ContentProps {
  frame: number
  fps: number
}

/**
 * Scene 1 — Discord Chaos (pure content, no PhoneFrame)
 * Renders the Discord chat UI content inside the unified phone.
 */
export const Scene1Content: React.FC<Scene1ContentProps> = ({ frame, fps }) => {
  const grayProgress = interpolate(frame, [70, 85], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const fadeOut = interpolate(frame, [92, 118], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.quad),
  })

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column' as const,
        height: '100%',
        opacity: fadeOut,
      }}
    >
      {/* Discord header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}
      >
        <svg width="20" height="15" viewBox="0 0 28 21" fill="none">
          <path
            d="M23.4 2.1C21.6 1.3 19.7 0.7 17.7 0.3C17.4 0.9 17.1 1.5 16.9 2.1C14.8 1.8 12.7 1.8 10.6 2.1C10.4 1.5 10.1 0.9 9.8 0.3C7.8 0.7 5.9 1.3 4.1 2.1C0.6 7.5 -0.4 12.8 0.1 18.1C2.6 20 5 21.1 7.3 21.8C7.8 21.1 8.3 20.3 8.7 19.5C7.9 19.2 7.2 18.8 6.5 18.4C6.7 18.3 6.8 18.1 7 18C11.5 20.1 16.5 20.1 21 18C21.1 18.1 21.3 18.3 21.5 18.4C20.8 18.8 20.1 19.2 19.3 19.5C19.7 20.3 20.2 21.1 20.7 21.8C23 21.1 25.4 20 27.9 18.1C28.5 12 26.9 6.7 23.4 2.1ZM9.3 14.9C7.9 14.9 6.8 13.7 6.8 12.1C6.8 10.6 7.9 9.3 9.3 9.3C10.7 9.3 11.9 10.6 11.8 12.1C11.8 13.7 10.7 14.9 9.3 14.9ZM18.7 14.9C17.3 14.9 16.2 13.7 16.2 12.1C16.2 10.6 17.3 9.3 18.7 9.3C20.1 9.3 21.3 10.6 21.2 12.1C21.2 13.7 20.1 14.9 18.7 14.9Z"
            fill="#5865F2"
          />
        </svg>
        <span
          style={{
            color: DISCORD_COLORS.textMuted,
            fontSize: 18,
            fontFamily: FONTS.body,
            fontWeight: 600,
          }}
        >
          #
        </span>
        <span
          style={{
            color: DISCORD_COLORS.text,
            fontSize: 16,
            fontFamily: FONTS.body,
            fontWeight: 600,
          }}
        >
          général
        </span>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          padding: '8px 12px',
          display: 'flex',
          flexDirection: 'column' as const,
          gap: 2,
          backgroundColor: DISCORD_COLORS.bg,
        }}
      >
        {MESSAGES.map((msg, i) => {
          const enterFrame = 18 + i * 11
          const enterP = spring({
            frame: frame - enterFrame,
            fps,
            config: { damping: 12, stiffness: 200 },
          })
          const textOpacity = interpolate(grayProgress, [0, 1], [1, 0.2])
          if (frame < enterFrame) return null
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '8px 4px',
                opacity: enterP,
                transform: `translateY(${interpolate(enterP, [0, 1], [12, 0])}px)`,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  backgroundColor: msg.color,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span
                  style={{
                    color: 'white',
                    fontSize: 14,
                    fontFamily: FONTS.body,
                    fontWeight: 700,
                  }}
                >
                  {msg.author[0]}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column' as const,
                  gap: 2,
                }}
              >
                <span
                  style={{
                    color: msg.color,
                    fontSize: 13,
                    fontFamily: FONTS.body,
                    fontWeight: 600,
                  }}
                >
                  {msg.author}
                </span>
                <span
                  style={{
                    color: `rgba(219,222,225,${textOpacity})`,
                    fontSize: 15,
                    fontFamily: FONTS.body,
                    fontWeight: 400,
                    lineHeight: 1.3,
                  }}
                >
                  {msg.text}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Input bar */}
      <div
        style={{
          padding: '8px 12px 16px 12px',
          flexShrink: 0,
          backgroundColor: DISCORD_COLORS.bg,
        }}
      >
        <div
          style={{
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderRadius: 20,
            padding: '10px 16px',
          }}
        >
          <span
            style={{
              color: 'rgba(255,255,255,0.2)',
              fontSize: 14,
              fontFamily: FONTS.body,
            }}
          >
            Envoyer un message...
          </span>
        </div>
      </div>
    </div>
  )
}
