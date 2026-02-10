import { motion } from 'framer-motion'
import { Calendar, Headphones, Check } from 'lucide-react'
import { mockMembers, MockNavbar } from './MockupShared'
import { PartyScreen, ProfileScreen } from './MockupScreensParty'

// Re-export shared + party screens for HeroMockup consumer
export { mockMembers, MockNavbar } from './MockupShared'
export { PartyScreen, ProfileScreen }

// ─── Screen 1: Home Dashboard ───────────────────────────
export function HomeScreen() {
  return (
    <div className="h-full flex flex-col bg-bg-base">
      <div className="px-4 pt-6 pb-3">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="text-md font-bold text-text-primary leading-tight">Salut MaxGamer_94 !</div>
          <div className="text-xs text-text-tertiary mt-0.5">T'es carré, toutes tes sessions sont confirmées</div>
        </motion.div>
        <motion.div
          className="absolute top-5 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/15 border border-success/20"
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: 'spring', stiffness: 400 }}
        >
          <span className="text-xs font-bold text-success">100%</span>
          <span className="text-xs text-success/70">fiable</span>
        </motion.div>
      </div>

      <motion.div
        className="mx-4 p-3.5 rounded-xl bg-gradient-to-br from-primary/[0.08] to-primary/[0.02] border border-primary/15"
        initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-2 mb-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Calendar className="w-3.5 h-3.5 text-text-primary" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-text-primary">Ranked du Mardi</div>
            <div className="text-xs text-text-tertiary">Les Invaincus · Demain 21h</div>
          </div>
          <motion.span
            className="px-2 py-0.5 rounded-full bg-success/15 text-xs text-success font-medium"
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6, type: 'spring' }}
          >
            Confirmée
          </motion.span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1.5">
            {mockMembers.slice(0, 4).map((m, i) => (
              <motion.div
                key={m.name}
                className="w-6 h-6 rounded-full border-[1.5px] border-bg-base flex items-center justify-center text-xs font-bold text-text-primary"
                style={{ backgroundColor: m.color }}
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4 + i * 0.08, type: 'spring' }}
              >
                {m.initial}
              </motion.div>
            ))}
          </div>
          <span className="text-xs text-text-secondary">4/5 présents</span>
          <motion.div className="ml-auto flex items-center gap-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
            <Check className="w-3 h-3 text-success" />
            <span className="text-xs text-success font-medium">Présent</span>
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        className="grid grid-cols-3 gap-2 mx-4 mt-3"
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
      >
        {[
          { label: 'Fiabilité', value: '94%', color: 'var(--color-success)' },
          { label: 'Sessions', value: '12', color: 'var(--color-primary)' },
          { label: 'Streak', value: '5', color: 'var(--color-gold)' },
        ].map((s) => (
          <div key={s.label} className="bg-bg-surface rounded-lg p-2.5 text-center border border-border-subtle">
            <div className="text-base font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs text-text-tertiary">{s.label}</div>
          </div>
        ))}
      </motion.div>

      <motion.div
        className="mx-4 mt-3 p-3 rounded-xl bg-bg-surface border border-border-subtle"
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
      >
        <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Ta semaine</div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-success/15 flex items-center justify-center">
              <Check className="w-3 h-3 text-success" />
            </div>
            <span className="text-xs text-text-primary">3 sessions jouées</span>
          </div>
          <span className="text-xs text-success font-medium">100% présent</span>
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-primary/15 flex items-center justify-center">
              <Headphones className="w-3 h-3 text-primary" />
            </div>
            <span className="text-xs text-text-primary">Party vocale active</span>
          </div>
          <motion.span className="text-xs text-primary" animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 2, repeat: Infinity }}>
            2 en ligne
          </motion.span>
        </div>
      </motion.div>

      <MockNavbar active="home" />
    </div>
  )
}

// ─── Screen 2: Squad with RSVP ──────────────────────────
export function SquadScreen() {
  return (
    <div className="h-full flex flex-col bg-bg-base">
      <div className="px-4 pt-5 pb-2">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
          <div className="text-md font-bold text-text-primary">Les Invaincus</div>
        </motion.div>
        <div className="text-xs text-text-tertiary mt-0.5">Valorant · 5 membres</div>
      </div>

      <motion.div
        className="mx-4 mb-3 flex items-center justify-between p-2.5 rounded-lg bg-bg-surface border border-primary/15"
        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
      >
        <div>
          <div className="text-xs text-text-tertiary uppercase tracking-wider">Code d'invitation</div>
          <div className="text-sm font-bold text-text-primary tracking-[0.15em]">8J9DQR</div>
        </div>
        <div className="px-3 py-1.5 rounded-md bg-primary text-xs text-text-primary font-medium">Copier</div>
      </motion.div>

      <motion.div
        className="mx-4 mb-3 p-2.5 rounded-lg border border-border-default"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Headphones className="w-3 h-3 text-success" />
          <span className="text-xs font-medium text-text-primary">Party vocale</span>
          <motion.span className="ml-auto text-xs text-success" animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 2, repeat: Infinity }}>
            2 en ligne
          </motion.span>
        </div>
        <div className="flex items-center gap-2">
          {mockMembers.slice(0, 2).map((m, i) => (
            <motion.div key={m.name} className="flex items-center gap-1.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 + i * 0.15 }}>
              <div className="relative">
                {i === 0 && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-success"
                    animate={{ scale: [1, 1.4], opacity: [0.3, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-text-primary" style={{ backgroundColor: m.color }}>
                  {m.initial}
                </div>
              </div>
              <span className="text-xs text-text-secondary">{m.name}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        className="mx-4 p-3 rounded-xl bg-bg-surface border border-border-default"
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
      >
        <div className="flex items-center gap-2 mb-2.5">
          <Calendar className="w-3.5 h-3.5 text-primary" />
          <div>
            <div className="text-xs font-semibold text-text-primary">Ranked du Mardi</div>
            <div className="text-xs text-text-tertiary">Demain 21:00 · 4/5 présents</div>
          </div>
        </div>
        <div className="flex gap-2">
          {[
            { label: 'Présent', color: 'var(--color-success)', active: true },
            { label: 'Peut-être', color: 'var(--color-gold)', active: false },
            { label: 'Absent', color: 'var(--color-error)', active: false },
          ].map((opt, i) => (
            <motion.div
              key={opt.label}
              className={`flex-1 py-1.5 rounded-lg text-center text-xs font-medium ${
                opt.active ? 'text-text-primary border' : 'text-text-tertiary border border-border-default'
              }`}
              style={opt.active ? { backgroundColor: `${opt.color}15`, borderColor: `${opt.color}40`, color: opt.color } : undefined}
              initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.6 + i * 0.1, type: 'spring' }}
            >
              {opt.label}
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div className="mx-4 mt-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
        <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Membres (5)</div>
        {mockMembers.slice(0, 3).map((m) => (
          <div key={m.name} className="flex items-center gap-2 mb-1.5">
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-text-primary" style={{ backgroundColor: m.color }}>
              {m.initial}
            </div>
            <span className="text-xs text-text-primary flex-1">{m.name}</span>
            <span className="text-xs text-success">{m.score}%</span>
          </div>
        ))}
      </motion.div>

      <MockNavbar active="squads" />
    </div>
  )
}

// ─── SCREENS CONFIG ─────────────────────────────────────
export const screens = [
  { id: 'home', component: HomeScreen, label: 'Accueil', duration: 4000 },
  { id: 'squad', component: SquadScreen, label: 'Squad', duration: 4000 },
  { id: 'party', component: PartyScreen, label: 'Party', duration: 3500 },
  { id: 'profile', component: ProfileScreen, label: 'Profil', duration: 3500 },
]
