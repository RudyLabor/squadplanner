import { m } from 'framer-motion'

interface Props {
  size?: number
  className?: string
}

const float = (delay: number, duration: number = 3) => ({
  y: [0, -6, 0],
  transition: { delay, duration, repeat: Infinity, ease: 'easeInOut' as const },
})

const pulse = (delay: number) => ({
  scale: [1, 1.08, 1],
  opacity: [0.7, 1, 0.7],
  transition: { delay, duration: 2.5, repeat: Infinity, ease: 'easeInOut' as const },
})

export function GamingHeroIllustration({ size = 300, className = '' }: Props) {
  return (
    <div className={`illustration-themed ${className}`}>
      <m.svg
        width={size}
        height={size}
        viewBox="0 0 300 300"
        fill="none"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <defs>
          {/* Gradient for the central glow */}
          <radialGradient id="heroGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--color-primary, #6366f1)" stopOpacity="0.15" />
            <stop offset="100%" stopColor="var(--color-primary, #6366f1)" stopOpacity="0" />
          </radialGradient>
          {/* Gradient for connecting lines */}
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--color-primary, #6366f1)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--color-purple, #a855f7)" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* Background ambient glow */}
        <m.circle
          cx="150"
          cy="150"
          r="120"
          fill="url(#heroGlow)"
          initial={{ scale: 0.8, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />

        {/* Orbiting ring */}
        <m.circle
          cx="150"
          cy="150"
          r="95"
          stroke="var(--color-primary, #6366f1)"
          strokeWidth="1"
          strokeOpacity="0.15"
          strokeDasharray="6 8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
        />

        {/* Connection lines between avatars */}
        {[
          'M107,95 L193,95',
          'M193,95 L210,190',
          'M210,190 L90,190',
          'M90,190 L107,95',
          'M107,95 L210,190',
          'M193,95 L90,190',
        ].map((d, i) => (
          <m.path
            key={`line-${i}`}
            d={d}
            stroke="url(#lineGrad)"
            strokeWidth="1"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 + i * 0.08, ease: [0.65, 0, 0.35, 1] }}
          />
        ))}

        {/* === Avatar 1 - Top Left (Primary / Leader) === */}
        <m.g
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 20 }}
        >
          <m.g animate={float(0, 3.2)}>
            {/* Glow ring */}
            <circle cx="107" cy="95" r="32" fill="var(--color-primary, #6366f1)" fillOpacity="0.08" />
            {/* Avatar circle */}
            <circle cx="107" cy="95" r="26" fill="var(--color-primary, #6366f1)" fillOpacity="0.15" stroke="var(--color-primary, #6366f1)" strokeWidth="2" />
            {/* Head */}
            <circle cx="107" cy="88" r="8" fill="var(--color-primary, #6366f1)" fillOpacity="0.6" />
            {/* Body */}
            <path d="M95 108 C95 100, 107 96, 107 96 C107 96, 119 100, 119 108" fill="var(--color-primary, #6366f1)" fillOpacity="0.4" />
            {/* Crown (leader icon) */}
            <m.path
              d="M99 78 L103 82 L107 78 L111 82 L115 78 L113 86 L101 86 Z"
              fill="var(--color-warning, #f5a623)"
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.9, type: 'spring', stiffness: 400, damping: 15 }}
            />
          </m.g>
        </m.g>

        {/* === Avatar 2 - Top Right (Purple) === */}
        <m.g
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.45, type: 'spring', stiffness: 300, damping: 20 }}
        >
          <m.g animate={float(0.4, 3.5)}>
            <circle cx="193" cy="95" r="32" fill="var(--color-purple, #a855f7)" fillOpacity="0.08" />
            <circle cx="193" cy="95" r="26" fill="var(--color-purple, #a855f7)" fillOpacity="0.15" stroke="var(--color-purple, #a855f7)" strokeWidth="2" />
            <circle cx="193" cy="88" r="8" fill="var(--color-purple, #a855f7)" fillOpacity="0.6" />
            <path d="M181 108 C181 100, 193 96, 193 96 C193 96, 205 100, 205 108" fill="var(--color-purple, #a855f7)" fillOpacity="0.4" />
            {/* Headphones on this avatar */}
            <path
              d="M183 86 V84 C183 79, 188 75, 193 75 C198 75, 203 79, 203 84 V86"
              stroke="var(--color-purple, #a855f7)"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />
            <rect x="181" y="85" width="4" height="6" rx="2" fill="var(--color-purple, #a855f7)" fillOpacity="0.6" />
            <rect x="201" y="85" width="4" height="6" rx="2" fill="var(--color-purple, #a855f7)" fillOpacity="0.6" />
          </m.g>
        </m.g>

        {/* === Avatar 3 - Bottom Right (Success/Green) === */}
        <m.g
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, type: 'spring', stiffness: 300, damping: 20 }}
        >
          <m.g animate={float(0.8, 3)}>
            <circle cx="210" cy="190" r="32" fill="var(--color-success, #34d399)" fillOpacity="0.08" />
            <circle cx="210" cy="190" r="26" fill="var(--color-success, #34d399)" fillOpacity="0.15" stroke="var(--color-success, #34d399)" strokeWidth="2" />
            <circle cx="210" cy="183" r="8" fill="var(--color-success, #34d399)" fillOpacity="0.6" />
            <path d="M198 203 C198 195, 210 191, 210 191 C210 191, 222 195, 222 203" fill="var(--color-success, #34d399)" fillOpacity="0.4" />
            {/* Online indicator */}
            <m.circle
              cx="224" cy="178"
              r="4"
              fill="var(--color-success, #34d399)"
              animate={pulse(0.5)}
            />
          </m.g>
        </m.g>

        {/* === Avatar 4 - Bottom Left (Pink) === */}
        <m.g
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.75, type: 'spring', stiffness: 300, damping: 20 }}
        >
          <m.g animate={float(1.2, 3.3)}>
            <circle cx="90" cy="190" r="32" fill="var(--color-pink, #ec4899)" fillOpacity="0.08" />
            <circle cx="90" cy="190" r="26" fill="var(--color-pink, #ec4899)" fillOpacity="0.15" stroke="var(--color-pink, #ec4899)" strokeWidth="2" />
            <circle cx="90" cy="183" r="8" fill="var(--color-pink, #ec4899)" fillOpacity="0.6" />
            <path d="M78 203 C78 195, 90 191, 90 191 C90 191, 102 195, 102 203" fill="var(--color-pink, #ec4899)" fillOpacity="0.4" />
            {/* Star badge */}
            <m.path
              d="M76 178 L78 174 L80 178 L84 179 L80 181 L78 185 L76 181 L72 179 Z"
              fill="var(--color-warning, #f5a623)"
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 1.1, type: 'spring', stiffness: 400, damping: 15 }}
            />
          </m.g>
        </m.g>

        {/* === Central Game Controller Icon === */}
        <m.g
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 250, damping: 18 }}
        >
          <m.g animate={float(0.2, 4)}>
            {/* Controller body background */}
            <circle cx="150" cy="148" r="22" fill="var(--color-primary, #6366f1)" fillOpacity="0.12" />
            {/* Controller body */}
            <path
              d="M135 144 C135 140, 138 138, 142 138 L158 138 C162 138, 165 140, 165 144 L167 152 C167 156, 164 158, 161 156 L158 154 L142 154 L139 156 C136 158, 133 156, 133 152 Z"
              fill="var(--color-primary, #6366f1)"
              fillOpacity="0.35"
              stroke="var(--color-primary, #6366f1)"
              strokeWidth="1.5"
            />
            {/* D-pad left */}
            <rect x="139" y="144" width="7" height="3" rx="1" fill="var(--color-primary, #6366f1)" fillOpacity="0.7" />
            <rect x="141" y="142" width="3" height="7" rx="1" fill="var(--color-primary, #6366f1)" fillOpacity="0.7" />
            {/* Buttons right */}
            <circle cx="157" cy="143" r="2" fill="var(--color-success, #34d399)" fillOpacity="0.8" />
            <circle cx="161" cy="146" r="2" fill="var(--color-pink, #ec4899)" fillOpacity="0.8" />
            {/* Analog sticks */}
            <circle cx="144" cy="150" r="2.5" fill="var(--color-primary, #6366f1)" fillOpacity="0.5" stroke="var(--color-primary, #6366f1)" strokeWidth="0.5" />
            <circle cx="156" cy="150" r="2.5" fill="var(--color-primary, #6366f1)" fillOpacity="0.5" stroke="var(--color-primary, #6366f1)" strokeWidth="0.5" />
          </m.g>
        </m.g>

        {/* === Floating Calendar/Clock Element (top) === */}
        <m.g
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.85, type: 'spring', stiffness: 300, damping: 20 }}
        >
          <m.g animate={float(1.5, 3.8)}>
            <rect x="134" y="38" width="32" height="26" rx="6" fill="var(--color-primary, #6366f1)" fillOpacity="0.1" stroke="var(--color-primary, #6366f1)" strokeWidth="1" />
            <line x1="134" y1="48" x2="166" y2="48" stroke="var(--color-primary, #6366f1)" strokeWidth="1" strokeOpacity="0.3" />
            {/* Clock hands */}
            <line x1="150" y1="54" x2="150" y2="49" stroke="var(--color-primary, #6366f1)" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="150" y1="54" x2="155" y2="56" stroke="var(--color-primary, #6366f1)" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="150" cy="54" r="1" fill="var(--color-primary, #6366f1)" />
            {/* Mini calendar date */}
            <text x="142" y="45" fill="var(--color-primary, #6366f1)" fontSize="6" fontWeight="bold" fontFamily="system-ui">21H</text>
          </m.g>
        </m.g>

        {/* === Small Floating Particles / Sparkles === */}
        {[
          { cx: 60, cy: 60, color: 'var(--color-primary, #6366f1)', delay: 1.0, dur: 2.8 },
          { cx: 245, cy: 55, color: 'var(--color-purple, #a855f7)', delay: 1.3, dur: 3.2 },
          { cx: 255, cy: 145, color: 'var(--color-success, #34d399)', delay: 0.8, dur: 2.5 },
          { cx: 45, cy: 145, color: 'var(--color-pink, #ec4899)', delay: 1.5, dur: 3.0 },
          { cx: 150, cy: 245, color: 'var(--color-warning, #f5a623)', delay: 1.1, dur: 2.6 },
          { cx: 70, cy: 240, color: 'var(--color-primary, #6366f1)', delay: 0.6, dur: 3.4 },
          { cx: 230, cy: 240, color: 'var(--color-purple, #a855f7)', delay: 1.4, dur: 2.9 },
        ].map((p, i) => (
          <m.circle
            key={`sparkle-${i}`}
            cx={p.cx}
            cy={p.cy}
            r="2.5"
            fill={p.color}
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 0.6 }}
            viewport={{ once: true }}
            transition={{ delay: p.delay, type: 'spring', stiffness: 400, damping: 20 }}
          />
        ))}

        {/* Animated pulse rings around center */}
        <m.circle
          cx="150"
          cy="148"
          r="36"
          stroke="var(--color-primary, #6366f1)"
          strokeWidth="1"
          fill="none"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{
            scale: [0.8, 1.3, 1.6],
            opacity: [0.3, 0.1, 0],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeOut', delay: 1 }}
        />
        <m.circle
          cx="150"
          cy="148"
          r="36"
          stroke="var(--color-purple, #a855f7)"
          strokeWidth="1"
          fill="none"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{
            scale: [0.8, 1.3, 1.6],
            opacity: [0.3, 0.1, 0],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeOut', delay: 2.5 }}
        />

        {/* === "SQUAD" text badge at bottom === */}
        <m.g
          initial={{ y: 10, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 1.2, duration: 0.5, ease: 'easeOut' }}
        >
          <rect x="118" y="265" width="64" height="22" rx="11" fill="var(--color-primary, #6366f1)" fillOpacity="0.15" stroke="var(--color-primary, #6366f1)" strokeWidth="1" />
          <text x="150" y="280" textAnchor="middle" fill="var(--color-primary, #6366f1)" fontSize="10" fontWeight="700" fontFamily="system-ui" letterSpacing="2">
            SQUAD
          </text>
        </m.g>
      </m.svg>
    </div>
  )
}
