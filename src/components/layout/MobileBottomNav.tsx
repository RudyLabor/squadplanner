import { memo, useCallback } from 'react'
import { Link } from 'react-router'
import { m, AnimatePresence } from 'framer-motion'
import {
  Home,
  Mic,
  Calendar,
  Users,
  Compass,
  User,
  Settings,
  HelpCircle,
  Phone,
  MoreHorizontal,
  X,
} from '../icons'
import { usePrefetch } from '../../hooks/usePrefetch'
import { useOverlayStore } from '../../hooks/useOverlayStore'

// Mobile nav items (Party sera au centre avec un style special)
const mobileNavLeft = [
  { path: '/home', icon: Home, label: 'Accueil' },
  { path: '/sessions', icon: Calendar, label: 'Sessions' },
] as const

const mobileNavRight = [
  { path: '/squads', icon: Users, label: 'Squads' },
  { path: '/profile', icon: User, label: 'Profil' },
] as const

const moreMenuItems = [
  { path: '/discover', icon: Compass, label: 'Découvrir' },
  { path: '/call-history', icon: Phone, label: 'Appels' },
  { path: '/settings', icon: Settings, label: 'Paramètres' },
  { path: '/help', icon: HelpCircle, label: 'Aide' },
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
      viewTransition
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
          <m.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="absolute -top-1.5 -right-2 min-w-[20px] h-[20px] px-1 rounded-full bg-info text-white text-xs font-bold flex items-center justify-center"
            aria-label={`${badge} non lus`}
          >
            {badge > 99 ? '99+' : badge}
          </m.span>
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
          <m.div
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

// More button with popup menu — uses shared overlay store for mutual exclusion with notifications
const MoreButton = memo(function MoreButton({ currentPath, onClose }: { currentPath: string; onClose: () => void }) {
  const { activeOverlay, toggle, close } = useOverlayStore()
  const isOpen = activeOverlay === 'more-menu'
  const isMoreActive = moreMenuItems.some(item => currentPath === item.path)

  const handleToggle = useCallback(() => {
    toggle('more-menu')
  }, [toggle])

  const handleItemClick = useCallback(() => {
    close('more-menu')
    onClose()
  }, [close, onClose])

  return (
    <div className="relative flex flex-col items-center justify-center min-w-[48px] min-h-[48px] touch-target">
      <button
        onClick={handleToggle}
        className="flex flex-col items-center justify-center"
        aria-label="Plus de pages"
        aria-expanded={isOpen}
      >
        <div className="relative">
          {isOpen ? (
            <X
              className="w-6 h-6 text-text-primary"
              strokeWidth={2}
              aria-hidden="true"
            />
          ) : (
            <MoreHorizontal
              className={`w-6 h-6 transition-colors ${isMoreActive ? 'text-text-primary' : 'text-text-tertiary'}`}
              strokeWidth={isMoreActive ? 2 : 1.5}
              aria-hidden="true"
            />
          )}
        </div>
        <span className={`text-sm mt-0.5 transition-colors ${isOpen || isMoreActive ? 'text-text-primary' : 'text-text-tertiary'}`}>
          Plus
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => close('more-menu')}
            />
            <m.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="absolute bottom-full right-0 mb-2 w-48 bg-bg-elevated border border-border-subtle rounded-xl shadow-lg z-50 overflow-hidden"
            >
              {moreMenuItems.map((item) => {
                const isActive = currentPath === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={handleItemClick}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                      isActive ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-bg-hover'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-text-tertiary'}`} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                )
              })}
            </m.div>
          </>
        )}
      </AnimatePresence>
    </div>
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
      className={`lg:hidden fixed bottom-0 left-0 right-0 bg-bg-base border-t border-border-subtle z-50 transition-transform duration-200 ${isKeyboardVisible ? 'translate-y-full' : 'translate-y-0'}`}
    >
      <div className="flex items-center justify-around py-2 mobile-nav-padding">
        {mobileNavLeft.map((item) => (
          <div key={item.path} onPointerEnter={createPrefetchHandler(item.path)} onPointerLeave={cancelPrefetch}>
            <MobileNavLink
              path={item.path}
              icon={item.icon}
              label={item.label}
              isActive={currentPath === item.path}
              badge={item.path === '/sessions' && pendingRsvpCount && pendingRsvpCount > 0 ? pendingRsvpCount : undefined}
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
            />
          </div>
        ))}
        <MoreButton currentPath={currentPath} onClose={() => {}} />
      </div>
    </nav>
  )
})
