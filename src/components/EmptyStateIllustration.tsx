
import { m } from 'framer-motion'

interface EmptyStateIllustrationProps {
  type: 'sessions' | 'squads' | 'friends' | 'messages'
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
    }
  }

  return <div className={`flex items-center justify-center ${className}`}>{getIllustration()}</div>
}

export default EmptyStateIllustration
