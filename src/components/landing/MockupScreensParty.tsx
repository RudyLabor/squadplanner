import { m } from 'framer-motion'
import {
  Users,
  Headphones,
  Mic,
  MicOff,
} from '../icons'
import { mockMembers, MockNavbar } from './MockupShared'

// ─── Screen 3: Voice Party ──────────────────────────────
export function PartyScreen() {
  return (
    <div className="h-full flex flex-col bg-bg-base relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,var(--color-success-8),transparent_70%)]" />

      <div className="relative z-10 px-4 pt-5 pb-2">
        <m.div className="text-xs text-success font-medium" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          Party vocale en cours
        </m.div>
        <m.div className="text-base font-bold text-text-primary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          Les Invaincus
        </m.div>
        <m.div className="text-xs text-text-tertiary mt-0.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
          En ligne depuis 47 min
        </m.div>
      </div>

      <div className="relative z-10 px-4 mt-2 flex-1">
        {mockMembers.slice(0, 4).map((member, i) => (
          <m.div
            key={member.name}
            className="flex items-center gap-3 mb-2.5 p-2 rounded-xl bg-white/[0.03] border border-border-subtle"
            initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.1, type: 'spring', stiffness: 300 }}
          >
            <div className="relative">
              {i === 0 && (
                <m.div
                  className="absolute -inset-0.5 rounded-full border border-success"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.2, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-text-primary ${i === 0 ? 'ring-1 ring-success/30' : ''}`}
                style={{ backgroundColor: member.color }}
              >
                {member.initial}
              </div>
            </div>
            <div className="flex-1">
              <div className={`text-xs font-medium ${i === 0 ? 'text-success' : 'text-text-primary'}`}>{member.name}</div>
              <div className="text-xs text-text-tertiary">{member.score}% fiable</div>
            </div>
            <div className="flex items-center gap-[2px] mr-1">
              {[0, 1, 2, 3].map((j) => (
                <m.div
                  key={j}
                  className="w-[2px] rounded-full"
                  style={{ backgroundColor: i < 2 ? 'var(--color-success)' : 'var(--color-text-secondary)' }}
                  animate={i < 2 ? { height: [3, 8 + Math.random() * 6, 3] } : { height: 3 }}
                  transition={i < 2 ? { duration: 0.4 + Math.random() * 0.3, repeat: Infinity, delay: j * 0.08, ease: 'easeInOut' } : undefined}
                />
              ))}
            </div>
            {i < 2 ? <Mic className="w-3.5 h-3.5 text-success" /> : <MicOff className="w-3.5 h-3.5 text-text-tertiary" />}
          </m.div>
        ))}

        <m.div className="flex items-center justify-center gap-[3px] mt-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((j) => (
            <m.div
              key={j}
              className="w-[2px] rounded-full bg-success"
              animate={{ height: [3, 10 + Math.random() * 6, 3] }}
              transition={{ duration: 0.5 + Math.random() * 0.3, repeat: Infinity, delay: j * 0.06, ease: 'easeInOut' }}
            />
          ))}
        </m.div>
      </div>

      <m.div
        className="relative z-10 flex items-center justify-center gap-4 py-3"
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
      >
        <div className="w-9 h-9 rounded-full bg-overlay-light flex items-center justify-center">
          <Mic className="w-4 h-4 text-text-primary" />
        </div>
        <div className="w-11 h-11 rounded-full bg-error flex items-center justify-center">
          <Headphones className="w-5 h-5 text-text-primary" />
        </div>
        <div className="w-9 h-9 rounded-full bg-overlay-light flex items-center justify-center">
          <Users className="w-4 h-4 text-text-primary" />
        </div>
      </m.div>

      <MockNavbar active="party" />
    </div>
  )
}

// ─── Screen 4: Profile with gamification ────────────────
export function ProfileScreen() {
  return (
    <div className="h-full flex flex-col bg-bg-base">
      <div className="flex flex-col items-center pt-5 pb-3">
        <m.div
          className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-xl font-bold text-text-primary mb-2"
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}
        >
          M
        </m.div>
        <div className="text-base font-bold text-text-primary">MaxGamer_94</div>
        <div className="text-xs text-text-tertiary">Membre depuis janv. 2026</div>
      </div>

      <m.div
        className="mx-4 p-3 rounded-xl bg-bg-surface border border-border-default mb-3"
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-xs">⚡</span>
            <span className="text-xs font-semibold text-text-primary">Niveau 4 — Régulier</span>
          </div>
          <span className="text-xs text-primary">340 XP</span>
        </div>
        <div className="h-1.5 rounded-full bg-overlay-light overflow-hidden">
          <m.div
            className="h-full rounded-full bg-gradient-to-r from-primary to-purple"
            initial={{ width: 0 }} animate={{ width: '68%' }} transition={{ delay: 0.5, duration: 1.2, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-text-tertiary">340 XP</span>
          <span className="text-xs text-text-tertiary">500 XP pour le niveau 5</span>
        </div>
      </m.div>

      <m.div
        className="mx-4 p-3 rounded-xl border border-warning/20 bg-warning/5 mb-3"
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12">
            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="20" fill="none" stroke="var(--color-gold-15)" strokeWidth="3" />
              <m.circle
                cx="24" cy="24" r="20" fill="none" stroke="var(--color-gold)" strokeWidth="3"
                strokeLinecap="round" strokeDasharray="125.6"
                initial={{ strokeDashoffset: 125.6 }} animate={{ strokeDashoffset: 125.6 * (1 - 0.94) }}
                transition={{ delay: 0.6, duration: 1.5, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-warning">94%</span>
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-text-primary">Score de fiabilité</div>
            <div className="text-xs text-warning">Légende</div>
            <div className="flex gap-0.5 mt-1">
              {[true, true, true, false, true, true].map((ok, j) => (
                <m.span key={j} className="text-xs" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.8 + j * 0.05 }}>
                  {ok ? '\u2705' : '\u274C'}
                </m.span>
              ))}
            </div>
          </div>
        </div>
      </m.div>

      <m.div
        className="grid grid-cols-2 gap-2 mx-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
      >
        {[
          { label: 'Sessions', value: '12', icon: '\uD83D\uDCC5' },
          { label: 'Check-ins', value: '11', icon: '\u2705' },
          { label: 'Squads', value: '2', icon: '\uD83D\uDC65' },
          { label: 'Challenges', value: '3/9', icon: '\uD83C\uDFC5' },
        ].map(s => (
          <div key={s.label} className="p-2.5 rounded-lg bg-bg-surface border border-border-subtle">
            <div className="flex items-center gap-1.5">
              <span className="text-xs">{s.icon}</span>
              <span className="text-sm font-bold text-text-primary">{s.value}</span>
            </div>
            <span className="text-xs text-text-tertiary">{s.label}</span>
          </div>
        ))}
      </m.div>

      <MockNavbar active="profile" />
    </div>
  )
}
