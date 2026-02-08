import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { Users, UserPlus, CalendarCheck, Headphones } from 'lucide-react'

interface DemoStep {
  id: string
  title: string
  subtitle: string
  duration: number
  icon: typeof Users
  color: string
}

const demoSteps: DemoStep[] = [
  { id: 'create', title: 'Cree ta Squad', subtitle: '"Les Invaincus"', duration: 3000, icon: Users, color: '#6366f1' },
  { id: 'invite', title: 'Invite tes potes', subtitle: '3 joueurs ont rejoint', duration: 2500, icon: UserPlus, color: '#34d399' },
  { id: 'rsvp', title: 'Chacun confirme', subtitle: '4/4 presents mardi 21h', duration: 2500, icon: CalendarCheck, color: '#f5a623' },
  { id: 'play', title: 'Jouez ensemble !', subtitle: 'Party vocale en cours', duration: 3000, icon: Headphones, color: '#a78bfa' },
]

const mockUsers = [
  { name: 'Alex', emoji: '🎮', color: '#6366f1' },
  { name: 'Sarah', emoji: '🎯', color: '#34d399' },
  { name: 'Lucas', emoji: '🔥', color: '#f5a623' },
  { name: 'Emma', emoji: '⭐', color: '#a78bfa' },
]

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto w-[240px] md:w-[280px]">
      <div className="bg-[#0a0a0c] rounded-[2rem] p-3 border border-[rgba(255,255,255,0.08)] shadow-2xl">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-[#0a0a0c] rounded-b-xl z-10" />
        {/* Screen */}
        <div className="bg-[#101012] rounded-[1.5rem] overflow-hidden h-[360px] md:h-[400px] relative">
          {children}
        </div>
      </div>
    </div>
  )
}

function CreateStep() {
  return (
    <div className="p-5 pt-8 h-full flex flex-col">
      <motion.div
        className="text-xs text-text-tertiary mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        Nouvelle Squad
      </motion.div>
      <motion.div
        className="bg-[#1a1a1e] rounded-xl p-3 border border-[rgba(255,255,255,0.06)] mb-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="text-xs text-text-quaternary mb-1">Nom de la squad</div>
        <motion.div
          className="text-sm text-text-primary font-medium"
          initial={{ width: 0 }}
          animate={{ width: 'auto' }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          Les Invaincus
        </motion.div>
      </motion.div>
      <motion.div
        className="bg-[#1a1a1e] rounded-xl p-3 border border-[rgba(255,255,255,0.06)] mb-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <div className="text-xs text-text-quaternary mb-1">Jeu</div>
        <div className="text-sm text-text-primary">Valorant</div>
      </motion.div>
      <motion.div
        className="mt-auto bg-primary text-white text-sm font-medium py-2.5 rounded-xl text-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.2, type: 'spring', stiffness: 300 }}
      >
        Creer la squad
      </motion.div>
    </div>
  )
}

function InviteStep() {
  return (
    <div className="p-5 pt-8 h-full">
      <motion.div
        className="text-xs text-text-tertiary mb-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        Les Invaincus
      </motion.div>
      <motion.div className="text-sm font-medium text-text-primary mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        Invite tes potes
      </motion.div>
      {mockUsers.map((user, i) => (
        <motion.div
          key={user.name}
          className="flex items-center gap-3 mb-2.5 p-2 rounded-lg bg-[rgba(255,255,255,0.03)]"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 + i * 0.3 }}
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: `${user.color}20` }}>
            {user.emoji}
          </div>
          <div className="flex-1 text-sm text-text-primary">{user.name}</div>
          <motion.div
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${user.color}20`, color: user.color }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.6 + i * 0.3, type: 'spring' }}
          >
            Rejoint
          </motion.div>
        </motion.div>
      ))}
    </div>
  )
}

function RSVPStep() {
  return (
    <div className="p-5 pt-8 h-full">
      <motion.div
        className="text-xs text-text-tertiary mb-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        Session de jeu
      </motion.div>
      <motion.div className="text-sm font-medium text-text-primary mb-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        Ranked Mardi 21h
      </motion.div>
      <motion.div className="text-xs text-text-quaternary mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        Les Invaincus · Valorant
      </motion.div>
      {mockUsers.map((user, i) => (
        <motion.div
          key={user.name}
          className="flex items-center gap-3 mb-2 p-2 rounded-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 + i * 0.2 }}
        >
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs" style={{ backgroundColor: `${user.color}20` }}>
            {user.emoji}
          </div>
          <div className="flex-1 text-sm text-text-secondary">{user.name}</div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.6 + i * 0.25, type: 'spring', stiffness: 400 }}
          >
            <div className="w-5 h-5 rounded-full bg-[#34d399] flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
          </motion.div>
        </motion.div>
      ))}
      <motion.div
        className="mt-3 text-center text-xs font-medium py-2 rounded-lg"
        style={{ backgroundColor: '#34d39920', color: '#34d399' }}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
      >
        Session confirmee !
      </motion.div>
    </div>
  )
}

function PlayStep() {
  return (
    <div className="p-5 pt-8 h-full flex flex-col items-center justify-center">
      <motion.div
        className="text-xs text-text-tertiary mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        Party vocale en cours
      </motion.div>
      <div className="flex -space-x-2 mb-4">
        {mockUsers.map((user, i) => (
          <motion.div
            key={user.name}
            className="w-10 h-10 rounded-full border-2 border-[#101012] flex items-center justify-center text-sm"
            style={{ backgroundColor: `${user.color}30` }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 + i * 0.1, type: 'spring' }}
          >
            {user.emoji}
          </motion.div>
        ))}
      </div>
      {/* Voice wave animation */}
      <div className="flex items-center gap-1 mb-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className="w-1 rounded-full bg-primary"
            animate={{
              height: [8, 20, 8],
            }}
            transition={{
              duration: 0.6,
              repeat: 4,
              delay: i * 0.1,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
      <motion.div
        className="text-sm font-medium text-text-primary"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        4 en ligne
      </motion.div>
      <motion.div
        className="text-xs text-success mt-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0.6, 1] }}
        transition={{ delay: 0.8, duration: 1.5 }}
      >
        En jeu · Valorant
      </motion.div>
    </div>
  )
}

const stepComponents: Record<string, React.FC> = {
  create: CreateStep,
  invite: InviteStep,
  rsvp: RSVPStep,
  play: PlayStep,
}

export function AnimatedDemo() {
  const [currentStep, setCurrentStep] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: false, amount: 0.3 })

  // Auto-advance steps
  useEffect(() => {
    if (!isInView) return
    const timer = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % demoSteps.length)
    }, demoSteps[currentStep].duration)
    return () => clearInterval(timer)
  }, [isInView, currentStep])

  const step = demoSteps[currentStep]
  const StepComponent = stepComponents[step.id]

  return (
    <section ref={ref} className="px-4 md:px-6 py-16 md:py-24">
      <div className="max-w-4xl mx-auto">
        <motion.h2
          className="text-2xl md:text-3xl font-bold text-center text-text-primary mb-3"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          En action
        </motion.h2>
        <motion.p
          className="text-text-tertiary text-center mb-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          De la creation de squad a la session de jeu en 30 secondes
        </motion.p>

        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
          {/* Phone mockup */}
          <div className="shrink-0">
            <PhoneFrame>
              <AnimatePresence mode="wait">
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <StepComponent />
                </motion.div>
              </AnimatePresence>
            </PhoneFrame>
          </div>

          {/* Step indicators */}
          <div className="flex md:flex-col gap-4 md:gap-3 w-full md:w-auto">
            {demoSteps.map((s, i) => {
              const Icon = s.icon
              const isActive = i === currentStep
              const isPast = i < currentStep
              return (
                <button
                  key={s.id}
                  onClick={() => setCurrentStep(i)}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all text-left flex-1 md:flex-initial ${
                    isActive
                      ? 'bg-bg-elevated border border-border-hover'
                      : 'border border-transparent hover:bg-bg-elevated/50'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      isActive || isPast ? '' : 'opacity-40'
                    }`}
                    style={{ backgroundColor: `${s.color}15` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: s.color }} />
                  </div>
                  <div className="hidden md:block">
                    <div className={`text-sm font-medium transition-colors ${isActive ? 'text-text-primary' : 'text-text-tertiary'}`}>
                      {s.title}
                    </div>
                    <div className="text-xs text-text-quaternary">{s.subtitle}</div>
                  </div>
                  {/* Progress bar for active step */}
                  {isActive && (
                    <motion.div
                      className="hidden md:block h-0.5 bg-primary rounded-full ml-auto"
                      initial={{ width: 0 }}
                      animate={{ width: 40 }}
                      transition={{ duration: s.duration / 1000, ease: 'linear' }}
                      key={`progress-${currentStep}`}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
