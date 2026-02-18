import { memo } from 'react'
import { Link } from 'react-router'
import { m } from 'framer-motion'
import { Home, Mic, Users, MessageCircle, Calendar } from '../icons'
import { usePrefetch } from '../../hooks/usePrefetch'

/**
 * Force navigation when React Router is stuck in a non-idle state.
 *
 * Root cause: Supabase auth lock deadlocks when the app is backgrounded
 * during a token refresh. lockAcquired stays true, pendingInLock fills up,
 * getSession() hangs forever, route loaders never finish, router stays in
 * "loading" state, and <Link> silently ignores all clicks.
 *
 * This handler:
 * 1. Clears the Supabase auth deadlock (lockAcquired + pendingInLock)
 * 2. Skips any stuck View Transition
 * 3. Forces navigation through the router's imperative API
 */
function handleStuckNavClick(e: React.MouseEvent, path: string) {
  const router = (window as any).__reactRouterDataRouter
  if (!router) return
  if (router.state?.navigation?.state === 'idle') return

  // Router is stuck — force navigation
  e.preventDefault()

  // Fix Supabase auth deadlock so route loaders can actually complete
  try {
    // supabaseMinimal is already loaded (imported at app startup)
    // Access the singleton via the global import cache
    const supabase = (window as any).__supabaseMinimal
    const auth = supabase?.auth
    if (auth?.lockAcquired) {
      auth.lockAcquired = false
      if (Array.isArray(auth.pendingInLock)) {
        auth.pendingInLock = []
      }
    }
  } catch {
    // ignore
  }

  // Skip any active View Transition
  if ((document as any).activeViewTransition) {
    try {
      ;(document as any).activeViewTransition.skipTransition()
    } catch {
      // ignore
    }
  }

  router.navigate(path, { replace: false })
}

// 5 nav items — Découvrir & Profil are in the TopBar "More" menu
const mobileNavLeft = [
  { path: '/home', icon: Home, label: 'Accueil' },
  { path: '/squads', icon: Users, label: 'Squads' },
  { path: '/sessions', icon: Calendar, label: 'Sessions' },
] as const

const mobileNavRight = [
  { path: '/messages', icon: MessageCircle, label: 'Messages' },
] as const

// OPTIMIZED: Memoized MobileNavLink
const MobileNavLink = memo(function MobileNavLink({
  path,
  icon: Icon,
  label,
  isActive,
  badge,
}: {
  path: string
  icon: React.ElementType
  label: string
  isActive: boolean
  badge?: number
}) {
  return (
    <Link
      to={path}
      onClick={(e) => handleStuckNavClick(e, path)}
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
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="absolute -top-1.5 -right-2 min-w-[20px] h-[20px] px-1 rounded-full bg-info text-white text-xs font-bold flex items-center justify-center"
            aria-label={`${badge} non lus`}
          >
            {badge > 99 ? '99+' : badge}
          </m.span>
        )}
      </div>
      <span
        className={`text-sm mt-0.5 transition-colors ${isActive ? 'text-text-primary' : 'text-text-tertiary'}`}
      >
        {label}
      </span>
    </Link>
  )
})

// OPTIMIZED: Memoized Party button
const PartyButton = memo(function PartyButton({
  isActive,
  hasActiveParty,
}: {
  isActive: boolean
  hasActiveParty: boolean
}) {
  return (
    <Link
      to="/party"
      onClick={(e) => handleStuckNavClick(e, '/party')}
      className="flex flex-col items-center justify-center min-w-[48px] min-h-[48px] touch-target"
      aria-label={hasActiveParty ? 'Party vocale - En cours' : 'Party vocale'}
      aria-current={isActive ? 'page' : undefined}
    >
      <div className="relative">
        <Mic
          className={`w-6 h-6 transition-colors duration-300 ${
            isActive ? 'text-text-primary' : hasActiveParty ? 'text-success' : 'text-text-tertiary'
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
      <span
        className={`text-sm mt-0.5 transition-colors duration-300 ${
          isActive ? 'text-text-primary' : hasActiveParty ? 'text-success' : 'text-text-tertiary'
        }`}
      >
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
  pendingRsvpCount: _pendingRsvpCount,
}: MobileBottomNavProps) {
  const { createPrefetchHandler, cancelPrefetch } = usePrefetch()

  return (
    <nav
      aria-label="Navigation mobile"
      className={`mobile-bottom-nav fixed bottom-0 left-0 right-0 z-50 bg-bg-base border-t border-border-subtle transition-transform duration-200 safe-area-pb ${isKeyboardVisible ? 'translate-y-full' : 'translate-y-0'}`}
      style={{
        paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0))',
      }}
    >
      {mobileNavLeft.map((item) => (
        <div
          key={item.path}
          className="flex justify-center py-2"
          onPointerEnter={createPrefetchHandler(item.path)}
          onPointerLeave={cancelPrefetch}
        >
          <MobileNavLink
            path={item.path}
            icon={item.icon}
            label={item.label}
            isActive={currentPath === item.path || currentPath.startsWith(item.path + '/')}
          />
        </div>
      ))}
      <div className="flex justify-center py-2">
        <PartyButton isActive={isPartyActive} hasActiveParty={isInVoiceChat} />
      </div>
      {mobileNavRight.map((item) => (
        <div
          key={item.path}
          className="flex justify-center py-2"
          onPointerEnter={createPrefetchHandler(item.path)}
          onPointerLeave={cancelPrefetch}
        >
          <MobileNavLink
            path={item.path}
            icon={item.icon}
            label={item.label}
            isActive={currentPath === item.path || currentPath.startsWith(item.path + '/')}
            badge={item.path === '/messages' && unreadMessages > 0 ? unreadMessages : undefined}
          />
        </div>
      ))}
    </nav>
  )
})
