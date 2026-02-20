
import { m } from 'framer-motion'

interface EmptyStateIllustrationProps {
  type: 'sessions' | 'squads' | 'friends' | 'messages' | 'achievements' | 'challenges' | 'notifications' | 'search_results' | 'call_history'
  className?: string
}

/**
 * Illustration animée pour les états vides
 * Utilise des formes géométriques simples et des couleurs CSS variables
 */
export function EmptyStateIllustration({ type, className = '' }: EmptyStateIllustrationProps) {
  const getIllustration = () => {
    switch (type) {
      case 'sessions':
        return (
          <svg viewBox="0 0 200 200" className={className} style={{ maxWidth: '200px' }}>
            {/* Gradient glow background */}
            <m.defs>
              <radialGradient id="sessionGlow" cx="50%" cy="50%" r="60%">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.15" />
                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
              </radialGradient>
            </m.defs>
            <m.circle
              cx="100"
              cy="100"
              r="80"
              fill="url(#sessionGlow)"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6 }}
            />
            {/* Calendar background */}
            <m.rect
              x="40"
              y="40"
              width="120"
              height="120"
              rx="12"
              fill="var(--color-primary-10)"
              stroke="var(--color-primary-30)"
              strokeWidth="2"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            />

            {/* Calendar header */}
            <m.rect
              x="40"
              y="40"
              width="120"
              height="30"
              fill="var(--color-primary-20)"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            />

            {/* Calendar dots */}
            {[0, 1, 2, 3].map((i) => (
              <m.circle
                key={i}
                cx={65 + i * 25}
                cy="95"
                r="4"
                fill="var(--color-primary)"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              />
            ))}

            {[0, 1, 2, 3].map((i) => (
              <m.circle
                key={i}
                cx={65 + i * 25}
                cy="120"
                r="4"
                fill="var(--color-text-tertiary)"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 + i * 0.1 }}
              />
            ))}

            {/* Plus sign */}
            <m.g
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.8, type: 'spring', stiffness: 200 }}
            >
              <circle cx="140" cy="140" r="20" fill="var(--color-success)" />
              <line
                x1="140"
                y1="130"
                x2="140"
                y2="150"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <line
                x1="130"
                y1="140"
                x2="150"
                y2="140"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </m.g>
          </svg>
        )

      case 'squads':
        return (
          <svg viewBox="0 0 200 200" className={className} style={{ maxWidth: '200px' }}>
            {/* Gradient glow background */}
            <m.defs>
              <radialGradient id="squadsGlow" cx="50%" cy="50%" r="60%">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.2" />
                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
              </radialGradient>
            </m.defs>
            <m.circle
              cx="100"
              cy="100"
              r="85"
              fill="url(#squadsGlow)"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6 }}
            />
            {/* Group circle background */}
            <m.circle
              cx="100"
              cy="100"
              r="70"
              fill="var(--color-primary-10)"
              stroke="var(--color-primary-30)"
              strokeWidth="2"
              strokeDasharray="4 4"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, rotate: 360 }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />

            {/* Avatar circles */}
            {[
              { cx: 100, cy: 70, delay: 0.2 },
              { cx: 80, cy: 110, delay: 0.3 },
              { cx: 120, cy: 110, delay: 0.4 },
            ].map((pos, i) => (
              <m.g key={i}>
                <m.circle
                  cx={pos.cx}
                  cy={pos.cy}
                  r="18"
                  fill="var(--color-primary-20)"
                  stroke="var(--color-primary)"
                  strokeWidth="2"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: pos.delay, type: 'spring', stiffness: 200 }}
                />
                <m.circle
                  cx={pos.cx}
                  cy={pos.cy - 3}
                  r="6"
                  fill="var(--color-primary)"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: pos.delay + 0.1 }}
                />
                <m.path
                  d={`M ${pos.cx - 8} ${pos.cy + 10} Q ${pos.cx} ${pos.cy + 8} ${pos.cx + 8} ${pos.cy + 10}`}
                  stroke="var(--color-primary)"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: pos.delay + 0.2 }}
                />
              </m.g>
            ))}

            {/* Plus sign */}
            <m.g
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.8, type: 'spring', stiffness: 200 }}
            >
              <circle cx="140" cy="130" r="15" fill="var(--color-success)" />
              <line
                x1="140"
                y1="122"
                x2="140"
                y2="138"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <line
                x1="132"
                y1="130"
                x2="148"
                y2="130"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </m.g>
          </svg>
        )

      case 'friends':
        return (
          <svg viewBox="0 0 200 200" className={className} style={{ maxWidth: '200px' }}>
            {/* Two people connecting */}
            <m.g
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              <circle
                cx="70"
                cy="80"
                r="20"
                fill="var(--color-primary-20)"
                stroke="var(--color-primary)"
                strokeWidth="2"
              />
              <circle cx="70" cy="75" r="8" fill="var(--color-primary)" />
              <path
                d="M 58 95 Q 70 90 82 95"
                stroke="var(--color-primary)"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
              />
            </m.g>

            <m.g
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <circle
                cx="130"
                cy="80"
                r="20"
                fill="var(--color-success-20)"
                stroke="var(--color-success)"
                strokeWidth="2"
              />
              <circle cx="130" cy="75" r="8" fill="var(--color-success)" />
              <path
                d="M 118 95 Q 130 90 142 95"
                stroke="var(--color-success)"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
              />
            </m.g>

            {/* Connection line */}
            <m.line
              x1="90"
              y1="80"
              x2="110"
              y2="80"
              stroke="var(--color-primary)"
              strokeWidth="3"
              strokeDasharray="5 5"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              strokeLinecap="round"
            />

            {/* Hearts */}
            <m.g
              initial={{ scale: 0, y: 20 }}
              animate={{ scale: [0, 1.2, 1], y: [20, -5, 0] }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              <path
                d="M 100 125 L 95 120 Q 90 115 90 110 Q 90 105 95 105 Q 100 105 100 110 Q 100 105 105 105 Q 110 105 110 110 Q 110 115 105 120 Z"
                fill="var(--color-error)"
              />
            </m.g>
          </svg>
        )

      case 'messages':
        return (
          <svg viewBox="0 0 200 200" className={className} style={{ maxWidth: '200px' }}>
            {/* Chat bubble 1 */}
            <m.g
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <rect
                x="30"
                y="60"
                width="100"
                height="60"
                rx="12"
                fill="var(--color-primary-10)"
                stroke="var(--color-primary-30)"
                strokeWidth="2"
              />
              <path d="M 50 120 L 45 130 L 60 120 Z" fill="var(--color-primary-10)" />
              <line
                x1="45"
                y1="80"
                x2="110"
                y2="80"
                stroke="var(--color-primary)"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <line
                x1="45"
                y1="95"
                x2="90"
                y2="95"
                stroke="var(--color-primary-30)"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </m.g>

            {/* Chat bubble 2 */}
            <m.g
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <rect
                x="70"
                y="100"
                width="100"
                height="60"
                rx="12"
                fill="var(--color-success-10)"
                stroke="var(--color-success-30)"
                strokeWidth="2"
              />
              <path d="M 150 160 L 155 170 L 140 160 Z" fill="var(--color-success-10)" />
              <line
                x1="85"
                y1="120"
                x2="150"
                y2="120"
                stroke="var(--color-success)"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <line
                x1="85"
                y1="135"
                x2="130"
                y2="135"
                stroke="var(--color-success-30)"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </m.g>

            {/* Dots animation */}
            {[0, 1, 2].map((i) => (
              <m.circle
                key={i}
                cx={100 + i * 12}
                cy="50"
                r="3"
                fill="var(--color-primary)"
                initial={{ y: 0 }}
                animate={{ y: [0, -5, 0] }}
                transition={{
                  delay: i * 0.2,
                  duration: 0.6,
                  repeat: Infinity,
                  repeatDelay: 1,
                }}
              />
            ))}
          </svg>
        )

      case 'achievements':
        return (
          <svg viewBox="0 0 200 200" className={className} style={{ maxWidth: '200px' }}>
            {/* Trophy */}
            <m.g
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              <rect x="80" y="110" width="40" height="30" rx="4" fill="var(--color-warning-20)" />
              <rect x="70" y="135" width="60" height="8" rx="4" fill="var(--color-warning-30)" />
              <path
                d="M 72 60 L 72 95 Q 72 110 100 110 Q 128 110 128 95 L 128 60 Z"
                fill="var(--color-warning-10)"
                stroke="var(--color-warning)"
                strokeWidth="2"
              />
              {/* Handles */}
              <m.path
                d="M 72 70 Q 55 70 55 85 Q 55 100 72 100"
                fill="none"
                stroke="var(--color-warning)"
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              />
              <m.path
                d="M 128 70 Q 145 70 145 85 Q 145 100 128 100"
                fill="none"
                stroke="var(--color-warning)"
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              />
            </m.g>
            {/* Star */}
            <m.path
              d="M 100 72 L 104 84 L 117 84 L 107 92 L 110 104 L 100 96 L 90 104 L 93 92 L 83 84 L 96 84 Z"
              fill="var(--color-warning)"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
            />
            {/* Sparkles */}
            {[
              { cx: 60, cy: 50, delay: 0.6 },
              { cx: 140, cy: 50, delay: 0.7 },
              { cx: 50, cy: 120, delay: 0.8 },
              { cx: 150, cy: 120, delay: 0.9 },
            ].map((s, i) => (
              <m.circle
                key={i}
                cx={s.cx}
                cy={s.cy}
                r="3"
                fill="var(--color-warning)"
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.3, 1] }}
                transition={{ delay: s.delay, duration: 0.4 }}
              />
            ))}
          </svg>
        )

      case 'challenges':
        return (
          <svg viewBox="0 0 200 200" className={className} style={{ maxWidth: '200px' }}>
            {/* Gamepad body */}
            <m.rect
              x="45"
              y="65"
              width="110"
              height="70"
              rx="20"
              fill="var(--color-error-10)"
              stroke="var(--color-error-30)"
              strokeWidth="2"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            />
            {/* D-pad */}
            <m.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <rect x="68" y="88" width="20" height="8" rx="2" fill="var(--color-error)" />
              <rect x="74" y="82" width="8" height="20" rx="2" fill="var(--color-error)" />
            </m.g>
            {/* Action buttons */}
            {[
              { cx: 120, cy: 85, delay: 0.4 },
              { cx: 132, cy: 97, delay: 0.5 },
              { cx: 120, cy: 109, delay: 0.6 },
              { cx: 108, cy: 97, delay: 0.7 },
            ].map((b, i) => (
              <m.circle
                key={i}
                cx={b.cx}
                cy={b.cy}
                r="5"
                fill={i === 0 ? 'var(--color-success)' : i === 1 ? 'var(--color-error)' : i === 2 ? 'var(--color-info)' : 'var(--color-warning)'}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: b.delay, type: 'spring', stiffness: 300 }}
              />
            ))}
            {/* Lightning bolt */}
            <m.path
              d="M 100 40 L 92 62 L 102 62 L 96 80 L 112 55 L 102 55 L 108 40 Z"
              fill="var(--color-warning)"
              stroke="var(--color-warning)"
              strokeWidth="1"
              strokeLinejoin="round"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8, type: 'spring', stiffness: 200 }}
            />
          </svg>
        )

      case 'notifications':
        return (
          <svg viewBox="0 0 200 200" className={className} style={{ maxWidth: '200px' }}>
            {/* Bell */}
            <m.path
              d="M 100 45 Q 70 45 70 80 L 70 110 L 60 120 L 140 120 L 130 110 L 130 80 Q 130 45 100 45 Z"
              fill="var(--color-primary-10)"
              stroke="var(--color-primary)"
              strokeWidth="2"
              initial={{ rotate: 0 }}
              animate={{ rotate: [0, 5, -5, 3, -3, 0] }}
              transition={{ delay: 0.3, duration: 0.8, ease: 'easeInOut' }}
            />
            {/* Clapper */}
            <m.ellipse
              cx="100"
              cy="128"
              rx="12"
              ry="6"
              fill="var(--color-primary)"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
            />
            {/* Check mark */}
            <m.g
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.8, type: 'spring', stiffness: 200 }}
            >
              <circle cx="130" cy="55" r="16" fill="var(--color-success)" />
              <m.path
                d="M 122 55 L 128 61 L 138 49"
                fill="none"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 1, duration: 0.4 }}
              />
            </m.g>
          </svg>
        )

      case 'search_results':
        return (
          <svg viewBox="0 0 200 200" className={className} style={{ maxWidth: '200px' }}>
            {/* Magnifying glass */}
            <m.circle
              cx="90"
              cy="85"
              r="35"
              fill="var(--color-purple-10, var(--color-primary-10))"
              stroke="var(--color-purple, var(--color-primary))"
              strokeWidth="3"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            />
            <m.line
              x1="115"
              y1="110"
              x2="145"
              y2="140"
              stroke="var(--color-purple, var(--color-primary))"
              strokeWidth="4"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            />
            {/* Question mark */}
            <m.text
              x="90"
              y="95"
              textAnchor="middle"
              fontSize="32"
              fontWeight="bold"
              fill="var(--color-purple, var(--color-primary))"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.6, 1] }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              ?
            </m.text>
          </svg>
        )

      case 'call_history':
        return (
          <svg viewBox="0 0 200 200" className={className} style={{ maxWidth: '200px' }}>
            {/* Phone icon */}
            <m.path
              d="M 70 60 Q 70 50 80 50 L 120 50 Q 130 50 130 60 L 130 140 Q 130 150 120 150 L 80 150 Q 70 150 70 140 Z"
              fill="var(--color-info-10, var(--color-primary-10))"
              stroke="var(--color-info, var(--color-primary))"
              strokeWidth="2"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
            />
            {/* Screen lines */}
            {[0, 1, 2].map((i) => (
              <m.line
                key={i}
                x1="82"
                y1={75 + i * 18}
                x2="118"
                y2={75 + i * 18}
                stroke="var(--color-info-30, var(--color-primary-30))"
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.3 + i * 0.15 }}
              />
            ))}
            {/* Clock overlay */}
            <m.g
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.6, type: 'spring', stiffness: 200 }}
            >
              <circle cx="135" cy="130" r="20" fill="var(--color-bg-base, #1a1a2e)" stroke="var(--color-info, var(--color-primary))" strokeWidth="2" />
              <circle cx="135" cy="130" r="17" fill="var(--color-info-10, var(--color-primary-10))" />
              <m.line
                x1="135" y1="130" x2="135" y2="120"
                stroke="var(--color-info, var(--color-primary))"
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.8 }}
              />
              <m.line
                x1="135" y1="130" x2="143" y2="133"
                stroke="var(--color-info, var(--color-primary))"
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 1 }}
              />
            </m.g>
          </svg>
        )
    }
  }

  return (
    <div className={`flex items-center justify-center illustration-glow ${className}`}>
      {getIllustration()}
    </div>
  )
}

export default EmptyStateIllustration
