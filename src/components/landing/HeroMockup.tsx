import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Users, Headphones, Check, Mic, MicOff, Home, MessageCircle, User } from 'lucide-react'

// ─── REALISTIC APP SCREENS ─────────────────────────────

const mockMembers = [
  { name: 'Max', initial: 'M', color: 'var(--color-primary)', score: 94 },
  { name: 'Luna', initial: 'L', color: 'var(--color-success)', score: 100 },
  { name: 'Kira', initial: 'K', color: 'var(--color-warning)', score: 87 },
  { name: 'Jay', initial: 'J', color: 'var(--color-purple)', score: 92 },
  { name: 'Zoé', initial: 'Z', color: 'var(--color-error)', score: 78 },
]

// ─── Shared Navbar Component (SVG icons instead of emojis) ───
function MockNavbar({ active }: { active: string }) {
  const items = [
    { icon: Home, label: 'Accueil', id: 'home' },
    { icon: Users, label: 'Squads', id: 'squads' },
    { icon: Mic, label: 'Party', id: 'party' },
    { icon: MessageCircle, label: 'Messages', id: 'messages' },
    { icon: User, label: 'Profil', id: 'profile' },
  ]
  return (
    <div className="mt-auto px-2 py-2 flex items-center justify-around border-t border-border-subtle">
      {items.map(item => {
        const Icon = item.icon
        const isActive = item.id === active
        return (
          <div key={item.id} className="flex flex-col items-center gap-0.5">
            <Icon className="w-[14px] h-[14px]" style={{ color: isActive ? 'var(--color-primary)' : 'var(--color-text-tertiary)' }} />
            <span className={`text-[7px] ${isActive ? 'text-primary font-medium' : 'text-text-tertiary'}`}>{item.label}</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Screen 1: Home Dashboard ───────────────────────────
function HomeScreen() {
  return (
    <div className="h-full flex flex-col bg-bg-base">
      {/* Header */}
      <div className="px-4 pt-6 pb-3">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="text-[15px] font-bold text-text-primary leading-tight">
            Salut MaxGamer_94 !
          </div>
          <div className="text-[10px] text-text-tertiary mt-0.5">
            T'es carré, toutes tes sessions sont confirmées
          </div>
        </motion.div>
        {/* Reliability badge */}
        <motion.div
          className="absolute top-5 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/15 border border-success/20"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 400 }}
        >
          <span className="text-[10px] font-bold text-success">100%</span>
          <span className="text-[8px] text-success/70">fiable</span>
        </motion.div>
      </div>

      {/* Next session card */}
      <motion.div
        className="mx-4 p-3.5 rounded-xl bg-gradient-to-br from-primary/[0.08] to-primary/[0.02] border border-primary/15"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-2 mb-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Calendar className="w-3.5 h-3.5 text-text-primary" />
          </div>
          <div className="flex-1">
            <div className="text-[11px] font-semibold text-text-primary">Ranked du Mardi</div>
            <div className="text-[9px] text-text-tertiary">Les Invaincus · Demain 21h</div>
          </div>
          <motion.span
            className="px-2 py-0.5 rounded-full bg-success/15 text-[8px] text-success font-medium"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.6, type: 'spring' }}
          >
            Confirmée
          </motion.span>
        </div>
        {/* RSVP avatars */}
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1.5">
            {mockMembers.slice(0, 4).map((m, i) => (
              <motion.div
                key={m.name}
                className="w-6 h-6 rounded-full border-[1.5px] border-bg-base flex items-center justify-center text-[8px] font-bold text-text-primary"
                style={{ backgroundColor: m.color }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4 + i * 0.08, type: 'spring' }}
              >
                {m.initial}
              </motion.div>
            ))}
          </div>
          <span className="text-[9px] text-text-secondary">4/5 présents</span>
          <motion.div
            className="ml-auto flex items-center gap-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <Check className="w-3 h-3 text-success" />
            <span className="text-[8px] text-success font-medium">Présent</span>
          </motion.div>
        </div>
      </motion.div>

      {/* Stats grid */}
      <motion.div
        className="grid grid-cols-3 gap-2 mx-4 mt-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        {[
          { label: 'Fiabilité', value: '94%', color: 'var(--color-success)' },
          { label: 'Sessions', value: '12', color: 'var(--color-primary)' },
          { label: 'Streak', value: '🔥 5', color: 'var(--color-gold)' },
        ].map((s) => (
          <div key={s.label} className="bg-bg-surface rounded-lg p-2.5 text-center border border-border-subtle">
            <div className="text-[13px] font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[8px] text-text-tertiary">{s.label}</div>
          </div>
        ))}
      </motion.div>

      {/* Weekly summary widget — fills the gap */}
      <motion.div
        className="mx-4 mt-3 p-3 rounded-xl bg-bg-surface border border-border-subtle"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <div className="text-[9px] font-semibold text-text-secondary uppercase tracking-wider mb-2">Ta semaine</div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-success/15 flex items-center justify-center">
              <Check className="w-3 h-3 text-success" />
            </div>
            <span className="text-[9px] text-text-primary">3 sessions jouées</span>
          </div>
          <span className="text-[8px] text-success font-medium">100% présent</span>
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-primary/15 flex items-center justify-center">
              <Headphones className="w-3 h-3 text-primary" />
            </div>
            <span className="text-[9px] text-text-primary">Party vocale active</span>
          </div>
          <motion.span
            className="text-[8px] text-primary"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            2 en ligne
          </motion.span>
        </div>
      </motion.div>

      <MockNavbar active="home" />
    </div>
  )
}

// ─── Screen 2: Squad with RSVP ──────────────────────────
function SquadScreen() {
  return (
    <div className="h-full flex flex-col bg-bg-base">
      <div className="px-4 pt-5 pb-2">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2"
        >
          <div className="text-[15px] font-bold text-text-primary">Les Invaincus</div>
          <span className="text-[10px]">👑</span>
        </motion.div>
        <div className="text-[9px] text-text-tertiary mt-0.5">Valorant · 5 membres</div>
      </div>

      {/* Invite code */}
      <motion.div
        className="mx-4 mb-3 flex items-center justify-between p-2.5 rounded-lg bg-bg-surface border border-primary/15"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div>
          <div className="text-[7px] text-text-tertiary uppercase tracking-wider">Code d'invitation</div>
          <div className="text-[12px] font-bold text-text-primary tracking-[0.15em]">8J9DQR</div>
        </div>
        <div className="px-3 py-1.5 rounded-md bg-primary text-[8px] text-text-primary font-medium">Copier</div>
      </motion.div>

      {/* Party vocale */}
      <motion.div
        className="mx-4 mb-3 p-2.5 rounded-lg border border-border-default"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Headphones className="w-3 h-3 text-success" />
          <span className="text-[10px] font-medium text-text-primary">Party vocale</span>
          <motion.span
            className="ml-auto text-[8px] text-success"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            2 en ligne
          </motion.span>
        </div>
        <div className="flex items-center gap-2">
          {mockMembers.slice(0, 2).map((m, i) => (
            <motion.div key={m.name} className="flex items-center gap-1.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 + i * 0.15 }}
            >
              <div className="relative">
                {i === 0 && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-success"
                    animate={{ scale: [1, 1.4], opacity: [0.3, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold text-text-primary" style={{ backgroundColor: m.color }}>
                  {m.initial}
                </div>
              </div>
              <span className="text-[8px] text-text-secondary">{m.name}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Session RSVP */}
      <motion.div
        className="mx-4 p-3 rounded-xl bg-bg-surface border border-border-default"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <div className="flex items-center gap-2 mb-2.5">
          <Calendar className="w-3.5 h-3.5 text-primary" />
          <div>
            <div className="text-[10px] font-semibold text-text-primary">Ranked du Mardi</div>
            <div className="text-[8px] text-text-tertiary">Demain 21:00 · 4/5 présents</div>
          </div>
        </div>
        {/* RSVP buttons */}
        <div className="flex gap-2">
          {[
            { label: 'Présent', color: 'var(--color-success)', active: true },
            { label: 'Peut-être', color: 'var(--color-gold)', active: false },
            { label: 'Absent', color: 'var(--color-error)', active: false },
          ].map((opt, i) => (
            <motion.div
              key={opt.label}
              className={`flex-1 py-1.5 rounded-lg text-center text-[8px] font-medium ${
                opt.active
                  ? 'text-text-primary border'
                  : 'text-text-tertiary border border-border-default'
              }`}
              style={opt.active ? {
                backgroundColor: `${opt.color}15`,
                borderColor: `${opt.color}40`,
                color: opt.color,
              } : undefined}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.6 + i * 0.1, type: 'spring' }}
            >
              {opt.label}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Members preview */}
      <motion.div
        className="mx-4 mt-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <div className="text-[9px] font-semibold text-text-secondary uppercase tracking-wider mb-2">Membres (5)</div>
        {mockMembers.slice(0, 3).map((m) => (
          <div key={m.name} className="flex items-center gap-2 mb-1.5">
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-bold text-text-primary" style={{ backgroundColor: m.color }}>
              {m.initial}
            </div>
            <span className="text-[9px] text-text-primary flex-1">{m.name}</span>
            <span className="text-[7px] text-success">{m.score}%</span>
          </div>
        ))}
      </motion.div>

      <MockNavbar active="squads" />
    </div>
  )
}

// ─── Screen 3: Voice Party (filled — no empty zones) ───
function PartyScreen() {
  return (
    <div className="h-full flex flex-col bg-bg-base relative">
      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,var(--color-success-8),transparent_70%)]" />

      <div className="relative z-10 px-4 pt-5 pb-2">
        <motion.div
          className="text-[9px] text-success font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Party vocale en cours
        </motion.div>
        <motion.div
          className="text-[13px] font-bold text-text-primary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          Les Invaincus
        </motion.div>
        <motion.div
          className="text-[8px] text-text-tertiary mt-0.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          En ligne depuis 47 min
        </motion.div>
      </div>

      {/* Participants list with audio indicators */}
      <div className="relative z-10 px-4 mt-2 flex-1">
        {mockMembers.slice(0, 4).map((m, i) => (
          <motion.div
            key={m.name}
            className="flex items-center gap-3 mb-2.5 p-2 rounded-xl bg-white/[0.03] border border-border-subtle"
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.1, type: 'spring', stiffness: 300 }}
          >
            <div className="relative">
              {i === 0 && (
                <motion.div
                  className="absolute -inset-0.5 rounded-full border border-success"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.2, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold text-text-primary ${i === 0 ? 'ring-1 ring-success/30' : ''}`}
                style={{ backgroundColor: m.color }}
              >
                {m.initial}
              </div>
            </div>
            <div className="flex-1">
              <div className={`text-[10px] font-medium ${i === 0 ? 'text-success' : 'text-text-primary'}`}>{m.name}</div>
              <div className="text-[7px] text-text-tertiary">{m.score}% fiable</div>
            </div>
            {/* Audio level bars per participant */}
            <div className="flex items-center gap-[2px] mr-1">
              {[0, 1, 2, 3].map((j) => (
                <motion.div
                  key={j}
                  className="w-[2px] rounded-full"
                  style={{ backgroundColor: i < 2 ? 'var(--color-success)' : 'var(--color-text-secondary)' }}
                  animate={i < 2 ? { height: [3, 8 + Math.random() * 6, 3] } : { height: 3 }}
                  transition={i < 2 ? {
                    duration: 0.4 + Math.random() * 0.3,
                    repeat: Infinity,
                    delay: j * 0.08,
                    ease: 'easeInOut',
                  } : undefined}
                />
              ))}
            </div>
            {i < 2 ? (
              <Mic className="w-3.5 h-3.5 text-success" />
            ) : (
              <MicOff className="w-3.5 h-3.5 text-text-tertiary" />
            )}
          </motion.div>
        ))}

        {/* Voice wave center */}
        <motion.div
          className="flex items-center justify-center gap-[3px] mt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((j) => (
            <motion.div
              key={j}
              className="w-[2px] rounded-full bg-success"
              animate={{ height: [3, 10 + Math.random() * 6, 3] }}
              transition={{
                duration: 0.5 + Math.random() * 0.3,
                repeat: Infinity,
                delay: j * 0.06,
                ease: 'easeInOut',
              }}
            />
          ))}
        </motion.div>
      </div>

      {/* Controls */}
      <motion.div
        className="relative z-10 flex items-center justify-center gap-4 py-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <div className="w-9 h-9 rounded-full bg-white/[0.06] flex items-center justify-center">
          <Mic className="w-4 h-4 text-text-primary" />
        </div>
        <div className="w-11 h-11 rounded-full bg-error flex items-center justify-center">
          <Headphones className="w-5 h-5 text-text-primary" />
        </div>
        <div className="w-9 h-9 rounded-full bg-white/[0.06] flex items-center justify-center">
          <Users className="w-4 h-4 text-text-primary" />
        </div>
      </motion.div>

      <MockNavbar active="party" />
    </div>
  )
}

// ─── Screen 4: Profile with gamification ────────────────
function ProfileScreen() {
  return (
    <div className="h-full flex flex-col bg-bg-base">
      {/* Avatar section */}
      <div className="flex flex-col items-center pt-5 pb-3">
        <motion.div
          className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-[20px] font-bold text-text-primary mb-2"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          M
        </motion.div>
        <div className="text-[13px] font-bold text-text-primary">MaxGamer_94</div>
        <div className="text-[8px] text-text-tertiary">Membre depuis janv. 2026</div>
      </div>

      {/* XP Progress */}
      <motion.div
        className="mx-4 p-3 rounded-xl bg-bg-surface border border-border-default mb-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px]">⚡</span>
            <span className="text-[10px] font-semibold text-text-primary">Niveau 4 — Régulier</span>
          </div>
          <span className="text-[8px] text-primary">340 XP</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary to-purple"
            initial={{ width: 0 }}
            animate={{ width: '68%' }}
            transition={{ delay: 0.5, duration: 1.2, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[7px] text-text-tertiary">340 XP</span>
          <span className="text-[7px] text-text-tertiary">500 XP pour le niveau 5</span>
        </div>
      </motion.div>

      {/* Reliability score */}
      <motion.div
        className="mx-4 p-3 rounded-xl border border-warning/20 bg-warning/5 mb-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12">
            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="20" fill="none" stroke="var(--color-gold-15)" strokeWidth="3" />
              <motion.circle
                cx="24" cy="24" r="20" fill="none" stroke="var(--color-gold)" strokeWidth="3"
                strokeLinecap="round" strokeDasharray="125.6"
                initial={{ strokeDashoffset: 125.6 }}
                animate={{ strokeDashoffset: 125.6 * (1 - 0.94) }}
                transition={{ delay: 0.6, duration: 1.5, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[11px] font-bold text-warning">94%</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-text-primary">Score de fiabilité</div>
            <div className="text-[8px] text-warning">🏆 Légende</div>
            <div className="flex gap-0.5 mt-1">
              {['✅', '✅', '✅', '❌', '✅', '✅'].map((s, j) => (
                <motion.span
                  key={j} className="text-[7px]"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8 + j * 0.05 }}
                >
                  {s}
                </motion.span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        className="grid grid-cols-2 gap-2 mx-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {[
          { label: 'Sessions', value: '12', icon: '📅' },
          { label: 'Check-ins', value: '11', icon: '✅' },
          { label: 'Squads', value: '2', icon: '👥' },
          { label: 'Challenges', value: '3/9', icon: '🏅' },
        ].map(s => (
          <div key={s.label} className="p-2.5 rounded-lg bg-bg-surface border border-border-subtle">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px]">{s.icon}</span>
              <span className="text-[12px] font-bold text-text-primary">{s.value}</span>
            </div>
            <span className="text-[7px] text-text-tertiary">{s.label}</span>
          </div>
        ))}
      </motion.div>

      <MockNavbar active="profile" />
    </div>
  )
}

// ─── SCREENS CONFIG ─────────────────────────────────────
const screens = [
  { id: 'home', component: HomeScreen, label: 'Accueil', duration: 4000 },
  { id: 'squad', component: SquadScreen, label: 'Squad', duration: 4000 },
  { id: 'party', component: PartyScreen, label: 'Party', duration: 3500 },
  { id: 'profile', component: ProfileScreen, label: 'Profil', duration: 3500 },
]

// ─── PHONE FRAME ────────────────────────────────────────
export function HeroMockup() {
  const [currentScreen, setCurrentScreen] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentScreen(prev => (prev + 1) % screens.length)
    }, screens[currentScreen].duration)
    return () => clearInterval(timer)
  }, [currentScreen])

  const screen = screens[currentScreen]
  const ScreenComponent = screen.component

  return (
    <div className="relative mx-auto hero-phone-float" style={{ width: 280 }}>
      {/* Glow behind phone */}
      <motion.div
        className="absolute -inset-8 rounded-[3rem]"
        style={{
          background: 'radial-gradient(ellipse at center, var(--color-primary-12) 0%, transparent 70%)',
        }}
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Phone body */}
      <div className="relative bg-gradient-to-b from-white/[0.12] to-white/[0.04] rounded-[2.5rem] p-[1px] shadow-2xl shadow-primary/20">
        <div className="bg-bg-elevated rounded-[2.5rem] p-2.5">
          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-bg-elevated rounded-b-2xl z-20">
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 rounded-full bg-white/10" />
          </div>

          {/* Screen */}
          <div className="bg-bg-base rounded-[2rem] overflow-hidden relative" style={{ height: 480 }}>
            {/* Status bar */}
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-5 pt-1.5 pb-1">
              <span className="text-[9px] text-text-secondary font-medium">21:00</span>
              <div className="flex items-center gap-1">
                <div className="flex items-end gap-[1px]">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className={`w-[2px] rounded-sm ${i <= 3 ? 'bg-white' : 'bg-text-tertiary'}`} style={{ height: 2 + i * 2 }} />
                  ))}
                </div>
                <div className="w-5 h-2.5 rounded-[2px] border border-text-tertiary ml-1">
                  <div className="w-3.5 h-1.5 bg-success rounded-[1px] m-[1px]" />
                </div>
              </div>
            </div>

            {/* Screen content with transitions */}
            <AnimatePresence mode="wait">
              <motion.div
                key={screen.id}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                className="h-full pt-6"
              >
                <ScreenComponent />
              </motion.div>
            </AnimatePresence>

            {/* Screen reflection */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none z-10 rounded-[2rem]" />
          </div>
        </div>
      </div>

      {/* Screen indicator dots — 44x44px touch targets */}
      <div className="flex items-center justify-center gap-1 mt-4">
        {screens.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setCurrentScreen(i)}
            className="flex items-center justify-center gap-1.5 group min-w-[44px] min-h-[44px]"
            aria-label={`Écran ${s.label}`}
          >
            <motion.div
              className="h-1 rounded-full"
              animate={{
                width: i === currentScreen ? 24 : 6,
                backgroundColor: i === currentScreen ? 'var(--color-primary)' : 'var(--color-overlay-medium)',
              }}
              transition={{ duration: 0.3 }}
            />
            {i === currentScreen && (
              <motion.span
                className="text-[10px] text-primary font-medium"
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
              >
                {s.label}
              </motion.span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
