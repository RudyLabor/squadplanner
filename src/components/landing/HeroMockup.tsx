import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Users, Headphones, Check, Mic, MicOff } from 'lucide-react'

// ─── REALISTIC APP SCREENS ─────────────────────────────
// Based on actual Squad Planner production app captures

const mockMembers = [
  { name: 'Max', initial: 'M', color: '#6366f1', score: 94 },
  { name: 'Luna', initial: 'L', color: '#34d399', score: 100 },
  { name: 'Kira', initial: 'K', color: '#f5a623', score: 87 },
  { name: 'Jay', initial: 'J', color: '#a78bfa', score: 92 },
  { name: 'Zoé', initial: 'Z', color: '#f87171', score: 78 },
]

// ─── Screen 1: Home Dashboard ───────────────────────────
function HomeScreen() {
  return (
    <div className="h-full flex flex-col bg-[#050506]">
      {/* Header */}
      <div className="px-4 pt-6 pb-3">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="text-[15px] font-bold text-white leading-tight">
            Salut MaxGamer_94 !
          </div>
          <div className="text-[10px] text-[#7d7d82] mt-0.5">
            T'es carré, toutes tes sessions sont confirmées
          </div>
        </motion.div>
        {/* Reliability badge */}
        <motion.div
          className="absolute top-5 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#34d399]/15 border border-[#34d399]/20"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 400 }}
        >
          <span className="text-[10px] font-bold text-[#34d399]">100%</span>
          <span className="text-[8px] text-[#34d399]/70">fiable</span>
        </motion.div>
      </div>

      {/* Next session card */}
      <motion.div
        className="mx-4 p-3.5 rounded-xl bg-gradient-to-br from-[rgba(99,102,241,0.08)] to-[rgba(99,102,241,0.02)] border border-[rgba(99,102,241,0.15)]"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-2 mb-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#6366f1] flex items-center justify-center">
            <Calendar className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="flex-1">
            <div className="text-[11px] font-semibold text-white">Ranked du Mardi</div>
            <div className="text-[9px] text-[#7d7d82]">Les Invaincus · Demain 21h</div>
          </div>
          <motion.span
            className="px-2 py-0.5 rounded-full bg-[#34d399]/15 text-[8px] text-[#34d399] font-medium"
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
                className="w-6 h-6 rounded-full border-[1.5px] border-[#050506] flex items-center justify-center text-[8px] font-bold text-white"
                style={{ backgroundColor: m.color }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4 + i * 0.08, type: 'spring' }}
              >
                {m.initial}
              </motion.div>
            ))}
          </div>
          <span className="text-[9px] text-[#a1a1a6]">4/5 présents</span>
          <motion.div
            className="ml-auto flex items-center gap-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <Check className="w-3 h-3 text-[#34d399]" />
            <span className="text-[8px] text-[#34d399] font-medium">Présent</span>
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
          { label: 'Fiabilité', value: '94%', color: '#34d399' },
          { label: 'Sessions', value: '12', color: '#6366f1' },
          { label: 'Streak', value: '🔥 5', color: '#f5a623' },
        ].map((s) => (
          <div key={s.label} className="bg-[#0f1012] rounded-lg p-2.5 text-center border border-[rgba(255,255,255,0.04)]">
            <div className="text-[13px] font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[8px] text-[#7d7d82]">{s.label}</div>
          </div>
        ))}
      </motion.div>

      {/* Bottom nav */}
      <div className="mt-auto px-2 py-2 flex items-center justify-around border-t border-[rgba(255,255,255,0.04)]">
        {[
          { icon: '🏠', label: 'Accueil', active: true },
          { icon: '👥', label: 'Squads', active: false },
          { icon: '🎙️', label: 'Party', active: false },
          { icon: '💬', label: 'Messages', active: false },
          { icon: '👤', label: 'Profil', active: false },
        ].map(item => (
          <div key={item.label} className="flex flex-col items-center gap-0.5">
            <span className="text-[12px]">{item.icon}</span>
            <span className={`text-[7px] ${item.active ? 'text-[#6366f1] font-medium' : 'text-[#7d7d82]'}`}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Screen 2: Squad with RSVP ──────────────────────────
function SquadScreen() {
  return (
    <div className="h-full flex flex-col bg-[#050506]">
      <div className="px-4 pt-5 pb-2">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2"
        >
          <div className="text-[15px] font-bold text-white">Les Invaincus</div>
          <span className="text-[10px]">👑</span>
        </motion.div>
        <div className="text-[9px] text-[#7d7d82] mt-0.5">Valorant · 5 membres</div>
      </div>

      {/* Invite code */}
      <motion.div
        className="mx-4 mb-3 flex items-center justify-between p-2.5 rounded-lg bg-[#0f1012] border border-[rgba(99,102,241,0.15)]"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div>
          <div className="text-[7px] text-[#7d7d82] uppercase tracking-wider">Code d'invitation</div>
          <div className="text-[12px] font-bold text-white tracking-[0.15em]">8J9DQR</div>
        </div>
        <div className="px-3 py-1.5 rounded-md bg-[#6366f1] text-[8px] text-white font-medium">Copier</div>
      </motion.div>

      {/* Party vocale */}
      <motion.div
        className="mx-4 mb-3 p-2.5 rounded-lg border border-[rgba(255,255,255,0.06)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Headphones className="w-3 h-3 text-[#34d399]" />
          <span className="text-[10px] font-medium text-white">Party vocale</span>
          <motion.span
            className="ml-auto text-[8px] text-[#34d399]"
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
                    className="absolute inset-0 rounded-full bg-[#34d399]"
                    animate={{ scale: [1, 1.4], opacity: [0.3, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold text-white" style={{ backgroundColor: m.color }}>
                  {m.initial}
                </div>
              </div>
              <span className="text-[8px] text-[#a1a1a6]">{m.name}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Session RSVP */}
      <motion.div
        className="mx-4 p-3 rounded-xl bg-[#0f1012] border border-[rgba(255,255,255,0.06)]"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <div className="flex items-center gap-2 mb-2.5">
          <Calendar className="w-3.5 h-3.5 text-[#6366f1]" />
          <div>
            <div className="text-[10px] font-semibold text-white">Ranked du Mardi</div>
            <div className="text-[8px] text-[#7d7d82]">Demain 21:00 · 4/5 présents</div>
          </div>
        </div>
        {/* RSVP buttons */}
        <div className="flex gap-2">
          {[
            { label: 'Présent', color: '#34d399', active: true },
            { label: 'Peut-être', color: '#f5a623', active: false },
            { label: 'Absent', color: '#f87171', active: false },
          ].map((opt, i) => (
            <motion.div
              key={opt.label}
              className={`flex-1 py-1.5 rounded-lg text-center text-[8px] font-medium ${
                opt.active
                  ? 'text-white border'
                  : 'text-[#7d7d82] border border-[rgba(255,255,255,0.06)]'
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
        <div className="text-[9px] font-semibold text-[#a1a1a6] uppercase tracking-wider mb-2">Membres (5)</div>
        {mockMembers.slice(0, 3).map((m) => (
          <div key={m.name} className="flex items-center gap-2 mb-1.5">
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-bold text-white" style={{ backgroundColor: m.color }}>
              {m.initial}
            </div>
            <span className="text-[9px] text-white flex-1">{m.name}</span>
            <span className="text-[7px] text-[#34d399]">{m.score}%</span>
          </div>
        ))}
      </motion.div>

      {/* Bottom nav */}
      <div className="mt-auto px-2 py-2 flex items-center justify-around border-t border-[rgba(255,255,255,0.04)]">
        {[
          { icon: '🏠', label: 'Accueil', active: false },
          { icon: '👥', label: 'Squads', active: true },
          { icon: '🎙️', label: 'Party', active: false },
          { icon: '💬', label: 'Messages', active: false },
          { icon: '👤', label: 'Profil', active: false },
        ].map(item => (
          <div key={item.label} className="flex flex-col items-center gap-0.5">
            <span className="text-[12px]">{item.icon}</span>
            <span className={`text-[7px] ${item.active ? 'text-[#6366f1] font-medium' : 'text-[#7d7d82]'}`}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Screen 3: Voice Party ──────────────────────────────
function PartyScreen() {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-[#050506] relative">
      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(52,211,153,0.08),transparent_70%)]" />

      <motion.div
        className="text-[9px] text-[#34d399] font-medium mb-1 relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        Party vocale en cours
      </motion.div>
      <motion.div
        className="text-[11px] font-bold text-white mb-5 relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        Les Invaincus
      </motion.div>

      {/* Avatars grid */}
      <div className="flex flex-wrap justify-center gap-4 mb-5 relative z-10">
        {mockMembers.slice(0, 4).map((m, i) => (
          <motion.div
            key={m.name}
            className="flex flex-col items-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 + i * 0.1, type: 'spring', stiffness: 300 }}
          >
            <div className="relative">
              {i === 0 && (
                <motion.div
                  className="absolute -inset-1 rounded-full border-2 border-[#34d399]"
                  animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.2, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
              <div className={`w-11 h-11 rounded-full flex items-center justify-center text-[12px] font-bold text-white ${i === 0 ? 'ring-2 ring-[#34d399]/40' : ''}`}
                style={{ backgroundColor: m.color }}
              >
                {m.initial}
              </div>
              {i < 2 && (
                <Mic className="absolute -bottom-0.5 -right-0.5 w-3 h-3 text-[#34d399]" />
              )}
              {i >= 2 && (
                <MicOff className="absolute -bottom-0.5 -right-0.5 w-3 h-3 text-[#7d7d82]" />
              )}
            </div>
            <span className={`text-[8px] mt-1 ${i === 0 ? 'text-[#34d399] font-medium' : 'text-[#a1a1a6]'}`}>
              {m.name}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Voice wave */}
      <motion.div
        className="flex items-center gap-[3px] mb-4 relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((j) => (
          <motion.div
            key={j}
            className="w-[2px] rounded-full bg-[#34d399]"
            animate={{ height: [4, 14 + Math.random() * 6, 4] }}
            transition={{
              duration: 0.5 + Math.random() * 0.3,
              repeat: Infinity,
              delay: j * 0.06,
              ease: 'easeInOut',
            }}
          />
        ))}
      </motion.div>

      {/* Controls */}
      <motion.div
        className="flex items-center gap-4 relative z-10"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <div className="w-9 h-9 rounded-full bg-[rgba(255,255,255,0.06)] flex items-center justify-center">
          <Mic className="w-4 h-4 text-white" />
        </div>
        <div className="w-11 h-11 rounded-full bg-[#f87171] flex items-center justify-center">
          <Headphones className="w-5 h-5 text-white" />
        </div>
        <div className="w-9 h-9 rounded-full bg-[rgba(255,255,255,0.06)] flex items-center justify-center">
          <Users className="w-4 h-4 text-white" />
        </div>
      </motion.div>

      {/* Timer */}
      <motion.div
        className="text-[9px] text-[#7d7d82] mt-3 relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        En ligne depuis 47 min
      </motion.div>
    </div>
  )
}

// ─── Screen 4: Profile with gamification ────────────────
function ProfileScreen() {
  return (
    <div className="h-full flex flex-col bg-[#050506]">
      {/* Avatar section */}
      <div className="flex flex-col items-center pt-5 pb-3">
        <motion.div
          className="w-14 h-14 rounded-2xl bg-[#6366f1] flex items-center justify-center text-[20px] font-bold text-white mb-2"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          M
        </motion.div>
        <div className="text-[13px] font-bold text-white">MaxGamer_94</div>
        <div className="text-[8px] text-[#7d7d82]">Membre depuis janv. 2026</div>
      </div>

      {/* XP Progress */}
      <motion.div
        className="mx-4 p-3 rounded-xl bg-[#0f1012] border border-[rgba(255,255,255,0.06)] mb-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px]">⚡</span>
            <span className="text-[10px] font-semibold text-white">Niveau 4 — Régulier</span>
          </div>
          <span className="text-[8px] text-[#6366f1]">340 XP</span>
        </div>
        <div className="h-1.5 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#6366f1] to-[#a78bfa]"
            initial={{ width: 0 }}
            animate={{ width: '68%' }}
            transition={{ delay: 0.5, duration: 1.2, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[7px] text-[#7d7d82]">340 XP</span>
          <span className="text-[7px] text-[#7d7d82]">500 XP pour le niveau 5</span>
        </div>
      </motion.div>

      {/* Reliability score */}
      <motion.div
        className="mx-4 p-3 rounded-xl border border-[#f5a623]/20 bg-[#f5a623]/5 mb-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-3">
          {/* Circular progress */}
          <div className="relative w-12 h-12">
            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(245,166,35,0.15)" strokeWidth="3" />
              <motion.circle
                cx="24" cy="24" r="20" fill="none" stroke="#f5a623" strokeWidth="3"
                strokeLinecap="round" strokeDasharray="125.6"
                initial={{ strokeDashoffset: 125.6 }}
                animate={{ strokeDashoffset: 125.6 * (1 - 0.94) }}
                transition={{ delay: 0.6, duration: 1.5, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[11px] font-bold text-[#f5a623]">94%</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-white">Score de fiabilité</div>
            <div className="text-[8px] text-[#f5a623]">🏆 Légende</div>
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
          <div key={s.label} className="p-2.5 rounded-lg bg-[#0f1012] border border-[rgba(255,255,255,0.04)]">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px]">{s.icon}</span>
              <span className="text-[12px] font-bold text-white">{s.value}</span>
            </div>
            <span className="text-[7px] text-[#7d7d82]">{s.label}</span>
          </div>
        ))}
      </motion.div>

      {/* Bottom nav */}
      <div className="mt-auto px-2 py-2 flex items-center justify-around border-t border-[rgba(255,255,255,0.04)]">
        {[
          { icon: '🏠', label: 'Accueil', active: false },
          { icon: '👥', label: 'Squads', active: false },
          { icon: '🎙️', label: 'Party', active: false },
          { icon: '💬', label: 'Messages', active: false },
          { icon: '👤', label: 'Profil', active: true },
        ].map(item => (
          <div key={item.label} className="flex flex-col items-center gap-0.5">
            <span className="text-[12px]">{item.icon}</span>
            <span className={`text-[7px] ${item.active ? 'text-[#6366f1] font-medium' : 'text-[#7d7d82]'}`}>{item.label}</span>
          </div>
        ))}
      </div>
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
          background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.12) 0%, transparent 70%)',
        }}
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Phone body */}
      <div className="relative bg-gradient-to-b from-[rgba(255,255,255,0.12)] to-[rgba(255,255,255,0.04)] rounded-[2.5rem] p-[1px] shadow-2xl shadow-[#6366f1]/20">
        <div className="bg-[#0a0a0c] rounded-[2.5rem] p-2.5">
          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-[#0a0a0c] rounded-b-2xl z-20">
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 rounded-full bg-[rgba(255,255,255,0.1)]" />
          </div>

          {/* Screen */}
          <div className="bg-[#050506] rounded-[2rem] overflow-hidden relative" style={{ height: 480 }}>
            {/* Status bar */}
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-5 pt-1.5 pb-1">
              <span className="text-[9px] text-[#a1a1a6] font-medium">21:00</span>
              <div className="flex items-center gap-1">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className={`w-[2px] rounded-sm ${i <= 3 ? 'bg-white' : 'bg-[#7d7d82]'}`} style={{ height: 4 + i * 1.5 }} />
                  ))}
                </div>
                <div className="w-5 h-2.5 rounded-[2px] border border-[#7d7d82] ml-1">
                  <div className="w-3.5 h-1.5 bg-[#34d399] rounded-[1px] m-[1px]" />
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

      {/* Screen indicator dots */}
      <div className="flex items-center justify-center gap-2 mt-4">
        {screens.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setCurrentScreen(i)}
            className="flex items-center gap-1.5 group"
          >
            <motion.div
              className="h-1 rounded-full"
              animate={{
                width: i === currentScreen ? 24 : 6,
                backgroundColor: i === currentScreen ? '#6366f1' : 'rgba(255,255,255,0.15)',
              }}
              transition={{ duration: 0.3 }}
            />
            {i === currentScreen && (
              <motion.span
                className="text-[10px] text-[#6366f1] font-medium"
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
