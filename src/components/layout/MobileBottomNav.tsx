import { memo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, Mic, MessageCircle, User, Users } from 'lucide-react'
import { usePrefetch } from '../../hooks/usePrefetch'

// Mobile nav items (Party sera au centre avec un style special)
const mobileNavLeft = [
  { path: '/home', icon: Home, label: 'Accueil' },
  { path: '/squads', icon: Users, label: 'Squads' },
] as const

const mobileNavRight = [
  { path: '/messages', icon: MessageCircle, label: 'Messages' },
  { path: '/profile', icon: User, label: 'Profil' },
] as const

// OPTIMIZED: Memoized MobileNavLink
const MobileNavLink = memo(function MobileNavLink({ path, icon: Icon, label, isActive, badge }: {
  path: string
  icon: React.ElementType
  label: string
  isActive: boolean
  badge?: number
}) {
  return (
    <Link
      to={path}
      className="flex flex-col items-center justify-center min-w-[48px] min-h-[48px] touch-target"
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
    >
      <div className="relative">
        <Icon
          className={`w-6 h-6 transition-colors ${isActive ? 'text-text-primary' : 'text-text-tertiary'}`}
          strokeWidth={isActive ? 2 : 1.5}
          fill={isActive ? 'currentColor' : 'none'}
          aria-hidden="true"
        />
        {badge !== undefined && badge > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="absolute -top-1.5 -right-2 min-w-[20px] h-[20px] px-1 rounded-full bg-info text-white text-xs font-bold flex items-center justify-center"
            aria-label={`${badge} non lus`}
          >
            {badge > 99 ? '99+' : badge}
          </motion.span>
        )}
      </div>
      <span className={`text-sm mt-0.5 transition-colors ${isActive ? 'text-text-primary' : 'text-text-tertiary'}`}>
        {label}
      </span>
    </Link>
  )
})

// OPTIMIZED: Memoized Party button
const PartyButton = memo(function PartyButton({ isActive, hasActiveParty }: { isActive: boolean; hasActiveParty: boolean }) {
  return (
    <Link
      to="/party"
      className="flex flex-col items-center justify-center min-w-[48px] min-h-[48px] touch-target"
      aria-label={hasActiveParty ? 'Party vocale - En cours' : 'Party vocale'}
      aria-current={isActive ? 'page' : undefined}
    >
      <div className="relative">
        <Mic
          className={`w-6 h-6 transition-colors duration-300 ${
            isActive
              ? 'text-text-primary'
              : hasActiveParty
                ? 'text-success'
                : 'text-text-tertiary'
          }`}
          strokeWidth={isActive ? 2 : 1.5}
          fill={isActive ? 'currentColor' : 'none'}
          aria-hidden="true"
        />
        {hasActiveParty && (
          <motion.div
            className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-success"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: 3 }}
            aria-hidden="true"
          />
        )}
      </div>
      <span className={`text-sm mt-0.5 transition-colors duration-300 ${
        isActive ? 'text-text-primary' : hasActiveParty ? 'text-success' : 'text-text-tertiary'
      }`}>
        Party
      </span>
    </Link>
  )
})

interface MobileBottomNavProps {
  currentPath: string
  isPartyActive: boolean
  isInVoiceChat: boolean
  isKeyboardVisible: boolean
  unreadMessages: number
  pendingRsvpCount?: number
}

export const MobileBottomNav = memo(function MobileBottomNav({
  currentPath,
  isPartyActive,
  isInVoiceChat,
  isKeyboardVisible,
  unreadMessages,
  pendingRsvpCount,
}: MobileBottomNavProps) {
  const { createPrefetchHandler, cancelPrefetch } = usePrefetch()

  return (
    <nav
      aria-label="Navigation mobile"
      className={`lg:hidden fixed bottom-0 left-0 right-0 bg-bg-base border-t border-surface-card z-50 transition-transform duration-200 ${isKeyboardVisible ? 'translate-y-full' : 'translate-y-0'}`}
    >
      <div className="flex items-center justify-around py-2 mobile-nav-padding">
        {mobileNavLeft.map((item) => (
          <div key={item.path} onPointerEnter={createPrefetchHandler(item.path)} onPointerLeave={cancelPrefetch}>
            <MobileNavLink
              path={item.path}
              icon={item.icon}
              label={item.label}
              isActive={currentPath === item.path}
              badge={item.path === '/squads' && pendingRsvpCount && pendingRsvpCount > 0 ? pendingRsvpCount : undefined}
            />
          </div>
        ))}
        <PartyButton isActive={isPartyActive} hasActiveParty={isInVoiceChat} />
        {mobileNavRight.map((item) => (
          <div key={item.path} onPointerEnter={createPrefetchHandler(item.path)} onPointerLeave={cancelPrefetch}>
            <MobileNavLink
              path={item.path}
              icon={item.icon}
              label={item.label}
              isActive={currentPath === item.path}
              badge={item.path === '/messages' && unreadMessages > 0 ? unreadMessages : undefined}
            />
          </div>
        ))}
      </div>
    </nav>
  )
})
