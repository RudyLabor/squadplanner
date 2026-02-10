import { motion } from 'framer-motion'
import { Users, UserPlus, CalendarCheck, Headphones, Home, MessageCircle, User, Mic, Share2 } from 'lucide-react'

export interface DemoStep {
  id: string
  title: string
  subtitle: string
  duration: number
  icon: typeof Users
  color: string
}

export const demoSteps: DemoStep[] = [
  { id: 'create', title: 'Crée ta Squad', subtitle: '"Les Invaincus"', duration: 3000, icon: Users, color: 'var(--color-primary)' },
  { id: 'invite', title: 'Invite tes potes', subtitle: '3 joueurs ont rejoint', duration: 2500, icon: UserPlus, color: 'var(--color-success)' },
  { id: 'rsvp', title: 'Chacun confirme', subtitle: '4/4 présents mardi 21h', duration: 2500, icon: CalendarCheck, color: 'var(--color-warning)' },
  { id: 'play', title: 'Jouez ensemble !', subtitle: 'Party vocale en cours', duration: 3000, icon: Headphones, color: 'var(--color-purple)' },
]

const mockUsers = [
  { name: 'Alex', emoji: '\uD83C\uDFAE', color: 'var(--color-primary)' },
  { name: 'Sarah', emoji: '\uD83C\uDFAF', color: 'var(--color-success)' },
  { name: 'Lucas', emoji: '\uD83D\uDD25', color: 'var(--color-warning)' },
  { name: 'Emma', emoji: '\u2B50', color: 'var(--color-purple)' },
  { name: 'Hugo', emoji: '\uD83C\uDFA7', color: 'var(--color-error)' },
]

// Shared navbar for stepper mockups
function DemoNavbar({ active }: { active: string }) {
  const items = [
    { icon: Home, label: 'Accueil', id: 'home' },
    { icon: Users, label: 'Squads', id: 'squads' },
    { icon: Mic, label: 'Party', id: 'party' },
    { icon: MessageCircle, label: 'Chat', id: 'chat' },
    { icon: User, label: 'Profil', id: 'profile' },
  ]
  return (
    <div className="mt-auto px-2 py-1.5 flex items-center justify-around border-t border-border-subtle">
      {items.map(item => {
        const Icon = item.icon
        const isActive = item.id === active
        return (
          <div key={item.id} className="flex flex-col items-center gap-0.5">
            <Icon className="w-3 h-3" style={{ color: isActive ? 'var(--color-primary)' : 'var(--color-text-tertiary)' }} />
            <span className={`text-[0.375rem] ${isActive ? 'text-primary font-medium' : 'text-text-tertiary'}`}>{item.label}</span>
          </div>
        )
      })}
    </div>
  )
}

export function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto w-[240px] md:w-[280px]">
      <div className="bg-bg-elevated rounded-[2rem] p-3 border border-border-hover shadow-2xl">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-bg-elevated rounded-b-xl z-10" />
        <div className="bg-bg-surface rounded-[1.5rem] overflow-hidden h-[340px] md:h-[380px] relative flex flex-col">
          {children}
        </div>
      </div>
    </div>
  )
}

function CreateStep() {
  return (
    <div className="p-5 pt-8 h-full flex flex-col">
      <motion.div className="text-xs text-text-tertiary mb-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        Nouvelle Squad
      </motion.div>
      <motion.div
        className="bg-surface-dark rounded-xl p-3 border border-border-default mb-3"
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
      >
        <div className="text-xs text-text-quaternary mb-1">Nom de la squad</div>
        <motion.div className="text-sm text-text-primary font-medium" initial={{ width: 0 }} animate={{ width: 'auto' }} transition={{ delay: 0.5, duration: 0.8 }}>
          Les Invaincus
        </motion.div>
      </motion.div>
      <motion.div
        className="bg-surface-dark rounded-xl p-3 border border-border-default mb-3"
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
      >
        <div className="text-xs text-text-quaternary mb-1">Jeu</div>
        <div className="text-sm text-text-primary">Valorant</div>
      </motion.div>
      <motion.div className="mb-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }}>
        <div className="text-xs text-text-quaternary mb-1.5">Jeux populaires</div>
        <div className="flex flex-wrap gap-1.5">
          {['League of Legends', 'Fortnite', 'Apex'].map((game) => (
            <span key={game} className="text-xs px-2 py-1 rounded-lg bg-border-subtle text-text-tertiary border border-border-default">
              {game}
            </span>
          ))}
        </div>
      </motion.div>
      <motion.div
        className="mt-auto bg-primary text-white text-sm font-medium py-2.5 rounded-xl text-center"
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.2, type: 'spring', stiffness: 300 }}
      >
        Créer la squad
      </motion.div>
      <DemoNavbar active="squads" />
    </div>
  )
}

function InviteStep() {
  return (
    <div className="p-5 pt-8 h-full flex flex-col">
      <motion.div className="text-xs text-text-tertiary mb-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        Les Invaincus
      </motion.div>
      <motion.div className="text-sm font-medium text-text-primary mb-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        Invite tes potes
      </motion.div>
      {mockUsers.map((user, i) => (
        <motion.div
          key={user.name}
          className="flex items-center gap-3 mb-2 p-1.5 rounded-lg bg-surface-card"
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.2 }}
        >
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs" style={{ backgroundColor: `${user.color}20` }}>
            {user.emoji}
          </div>
          <div className="flex-1 text-sm text-text-primary">{user.name}</div>
          <motion.div
            className="text-xs px-2 py-0.5 rounded-full bg-success/15 text-success font-medium"
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 + i * 0.2, type: 'spring' }}
          >
            Rejoint
          </motion.div>
        </motion.div>
      ))}
      <motion.div
        className="mt-auto flex items-center gap-2 p-2.5 rounded-xl bg-primary-10 border border-primary"
        initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.3 }}
      >
        <Share2 className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs text-text-tertiary flex-1">squadplanner.fr/join/8J9DQR</span>
        <span className="text-xs text-primary font-medium">Copier</span>
      </motion.div>
      <DemoNavbar active="squads" />
    </div>
  )
}

function RSVPStep() {
  return (
    <div className="p-5 pt-8 h-full flex flex-col">
      <motion.div className="text-xs text-text-tertiary mb-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        Session de jeu
      </motion.div>
      <motion.div className="text-sm font-medium text-text-primary mb-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        Ranked Mardi 21h
      </motion.div>
      <motion.div className="text-xs text-text-quaternary mb-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        Les Invaincus · Valorant
      </motion.div>
      {mockUsers.slice(0, 4).map((user, i) => (
        <motion.div
          key={user.name}
          className="flex items-center gap-3 mb-2 p-2 rounded-lg"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + i * 0.2 }}
        >
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs" style={{ backgroundColor: `${user.color}20` }}>
            {user.emoji}
          </div>
          <div className="flex-1 text-sm text-text-secondary">{user.name}</div>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6 + i * 0.25, type: 'spring', stiffness: 400 }}>
            <div className="w-5 h-5 rounded-full bg-success flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
          </motion.div>
        </motion.div>
      ))}
      <motion.div
        className="mt-auto text-center text-xs font-medium py-2 rounded-lg"
        style={{ backgroundColor: 'var(--color-success-20)', color: 'var(--color-success)' }}
        initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5 }}
      >
        Session confirmée !
      </motion.div>
      <DemoNavbar active="home" />
    </div>
  )
}

function PlayStep() {
  return (
    <div className="p-5 pt-8 h-full flex flex-col">
      <motion.div className="text-xs text-success font-medium mb-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        Party vocale en cours
      </motion.div>
      <motion.div className="text-sm font-medium text-text-primary mb-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        Les Invaincus · Valorant
      </motion.div>
      {mockUsers.slice(0, 4).map((user, i) => (
        <motion.div
          key={user.name}
          className="flex items-center gap-2.5 mb-2 p-1.5 rounded-lg bg-surface-card"
          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.1, type: 'spring' }}
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs border-2 border-bg-surface" style={{ backgroundColor: `${user.color}30` }}>
            {user.emoji}
          </div>
          <div className="flex-1">
            <div className={`text-sm font-medium ${i === 0 ? 'text-success' : 'text-text-primary'}`}>{user.name}</div>
          </div>
          <div className="flex items-center gap-[2px]">
            {[0, 1, 2].map((j) => (
              <motion.div
                key={j}
                className="w-[2px] rounded-full"
                style={{ backgroundColor: i < 2 ? 'var(--color-success)' : 'var(--color-text-tertiary)' }}
                animate={i < 2 ? { height: [3, 8 + Math.random() * 4, 3] } : { height: 3 }}
                transition={i < 2 ? { duration: 0.4, repeat: Infinity, delay: j * 0.1, ease: 'easeInOut' } : undefined}
              />
            ))}
          </div>
        </motion.div>
      ))}
      <div className="flex items-center justify-center gap-1 my-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className="w-1 rounded-full bg-primary"
            animate={{ height: [8, 20, 8] }}
            transition={{ duration: 0.6, repeat: 4, delay: i * 0.1, ease: 'easeInOut' }}
          />
        ))}
      </div>
      <motion.div className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
        <div className="text-sm font-medium text-text-primary">4 en ligne</div>
        <motion.div className="text-xs text-success mt-0.5" animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 2, repeat: Infinity }}>
          En jeu · Valorant
        </motion.div>
      </motion.div>
      <DemoNavbar active="party" />
    </div>
  )
}

export const stepComponents: Record<string, React.FC> = {
  create: CreateStep,
  invite: InviteStep,
  rsvp: RSVPStep,
  play: PlayStep,
}
