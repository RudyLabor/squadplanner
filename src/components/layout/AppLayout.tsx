import { useEffect, useState, memo, useCallback, useMemo, useRef } from 'react'
import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, Users, Mic, MessageCircle, User, Plus, Zap, Pin, PinOff, Settings, HelpCircle, Phone, Calendar, Compass } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { useAuthStore, useSquadsStore, useVoiceChatStore, useKeyboardVisible, useUnreadCountStore, useSquadNotificationsStore, useGlobalPresence } from '../../hooks'
import { useCreateSessionModal } from '../CreateSessionModal'
import { getOptimizedAvatarUrl } from '../../utils/avatarUrl'
import { prefetchRoute } from '../../lib/queryClient'
import { SquadPlannerLogo } from '../SquadPlannerLogo'
import { Breadcrumbs } from './Breadcrumbs'
import { GlobalSearch } from '../GlobalSearch'
import { NotificationBell } from '../NotificationCenter'
import { Tooltip } from '../ui/Tooltip'
import { StatusSelector } from '../StatusSelector'
import { CustomStatusModal } from '../CustomStatusModal'

interface AppLayoutProps {
  children: ReactNode
}

// Navigation items (Party handled separately on mobile)
const navItems = [
  { path: '/home', icon: Home, label: 'Accueil' },
  { path: '/squads', icon: Users, label: 'Squads' },
  { path: '/sessions', icon: Calendar, label: 'Sessions' },
  { path: '/party', icon: Mic, label: 'Party' },
  { path: '/messages', icon: MessageCircle, label: 'Messages' },
  { path: '/discover', icon: Compass, label: 'Decouvrir' },
  { path: '/profile', icon: User, label: 'Profil' },
] as const

// Mobile nav items (Party sera au centre avec un style spécial)
const mobileNavLeft = [
  { path: '/home', icon: Home, label: 'Accueil' },
  { path: '/sessions', icon: Calendar, label: 'Sessions' },
] as const

const mobileNavRight = [
  { path: '/messages', icon: MessageCircle, label: 'Messages' },
  { path: '/profile', icon: User, label: 'Profil' },
] as const

// PHASE 5: Track prefetched routes to avoid redundant prefetch calls
const prefetchedRoutes = new Set<string>()

// OPTIMIZED: Memoized NavLink to prevent unnecessary re-renders
const NavLink = memo(function NavLink({ path, icon: Icon, label, isActive, badge, collapsed, userId }: {
  path: string
  icon: React.ElementType
  label: string
  isActive: boolean
  badge?: number
  collapsed?: boolean
  userId?: string
}) {
  // PHASE 5: Prefetch route data on hover for instant navigation
  const handlePrefetch = useCallback(() => {
    if (!prefetchedRoutes.has(path)) {
      prefetchedRoutes.add(path)
      prefetchRoute(path, userId).catch(() => {})
    }
  }, [path, userId])

  const linkContent = (
    <Link to={path} aria-label={label} aria-current={isActive ? 'page' : undefined} onPointerEnter={handlePrefetch}>
      <motion.div
        className={`
          relative flex items-center ${collapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 rounded-xl transition-interactive
          ${isActive
            ? 'bg-primary-10 text-primary'
            : 'text-text-secondary hover:bg-surface-card hover:text-text-primary'
          }
        `}
        whileHover={{ x: collapsed ? 0 : 4 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.25 }}
      >
        <Icon className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} />
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.span
              key="label"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.15 }}
              className="text-md font-medium whitespace-nowrap overflow-hidden"
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
        {badge && badge > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className={`${collapsed ? 'absolute -top-1 -right-1' : 'absolute right-3'} w-5 h-5 rounded-full bg-error text-white text-xs font-bold flex items-center justify-center`}
          >
            {badge > 9 ? '9+' : badge}
          </motion.span>
        )}
      </motion.div>
    </Link>
  )

  // Use styled Tooltip instead of native title when collapsed
  if (collapsed) {
    return (
      <Tooltip content={label} position="right" delay={300}>
        {linkContent}
      </Tooltip>
    )
  }

  return linkContent
})

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
            className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-info text-white text-xs font-bold flex items-center justify-center"
            aria-label={`${badge} non lus`}
          >
            {badge > 99 ? '99+' : badge}
          </motion.span>
        )}
      </div>
      <span className={`text-xs mt-1 transition-colors ${isActive ? 'text-text-primary' : 'text-text-tertiary'}`}>
        {label}
      </span>
    </Link>
  )
})

// Desktop content wrapper - handles responsive margin without duplicate rendering
const DesktopContentWrapper = memo(function DesktopContentWrapper({
  isExpanded,
  isKeyboardVisible,
  children
}: {
  isExpanded: boolean
  isKeyboardVisible: boolean
  children: ReactNode
}) {
  // Track if we're on desktop for margin calculation
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024)
    checkDesktop()
    window.addEventListener('resize', checkDesktop)
    return () => window.removeEventListener('resize', checkDesktop)
  }, [])

  // Calculate margin: 0 on mobile, dynamic on desktop
  const marginLeft = isDesktop ? (isExpanded ? 256 : 72) : 0

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className={`flex-1 lg:pb-0 overflow-y-auto overflow-x-hidden scrollbar-hide-mobile overscroll-contain ${isKeyboardVisible ? 'pb-0' : 'pb-mobile-nav'}`}
    >
      <motion.div
        initial={false}
        animate={{ marginLeft }}
        transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {children}
      </motion.div>
    </main>
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
      <span className={`text-xs mt-1 transition-colors duration-300 ${
        isActive ? 'text-text-primary' : hasActiveParty ? 'text-success' : 'text-text-tertiary'
      }`}>
        Party
      </span>
    </Link>
  )
})

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation()

  // OPTIMIZED: Use shallow selectors to prevent re-renders on unrelated state changes
  const { profile, user } = useAuthStore(useShallow(state => ({
    profile: state.profile,
    user: state.user
  })))

  // Keep for potential future use - only subscribes to store
  useSquadsStore()

  // OPTIMIZED: Select only what we need
  const isInVoiceChat = useVoiceChatStore(state => state.isConnected)
  const isKeyboardVisible = useKeyboardVisible()

  // PHASE 3.1: Create session modal
  const openCreateSessionModal = useCreateSessionModal(state => state.open)

  // OPTIMIZED: Select only totalUnread and actions with useShallow
  const { totalUnread: unreadMessages, fetchCounts, subscribe, unsubscribe } = useUnreadCountStore(
    useShallow(state => ({
      totalUnread: state.totalUnread,
      fetchCounts: state.fetchCounts,
      subscribe: state.subscribe,
      unsubscribe: state.unsubscribe
    }))
  )

  // PHASE 3.5: Squad notifications (pending RSVPs)
  const {
    pendingRsvpCount,
    fetchPendingCounts,
    subscribe: subscribeSquad,
    unsubscribe: unsubscribeSquad
  } = useSquadNotificationsStore(
    useShallow(state => ({
      pendingRsvpCount: state.pendingRsvpCount,
      fetchPendingCounts: state.fetchPendingCounts,
      subscribe: state.subscribe,
      unsubscribe: state.unsubscribe
    }))
  )

  // PHASE 4.2: Global presence — broadcast status to all users
  useGlobalPresence({
    userId: user?.id,
    username: profile?.username || '',
    avatarUrl: profile?.avatar_url || null,
  })

  // PHASE 4.2.3: Custom status modal state
  const [showCustomStatusModal, setShowCustomStatusModal] = useState(false)

  // Sidebar collapse state
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const [sidebarPinned, setSidebarPinned] = useState(() => {
    const saved = localStorage.getItem('sidebar-pinned')
    return saved === 'true'
  })

  // Determine if sidebar should show expanded content
  const isExpanded = sidebarExpanded || sidebarPinned

  // Debounce sidebar expansion to prevent click interference (UX 3)
  const sidebarHoverTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const handleMouseEnter = useCallback(() => {
    sidebarHoverTimer.current = setTimeout(() => setSidebarExpanded(true), 120)
  }, [])
  const handleMouseLeave = useCallback(() => {
    clearTimeout(sidebarHoverTimer.current)
    setSidebarExpanded(false)
  }, [])
  const togglePinned = useCallback(() => setSidebarPinned(p => !p), [])

  // Save pinned state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebar-pinned', String(sidebarPinned))
  }, [sidebarPinned])

  // Subscribe to unread count updates
  useEffect(() => {
    if (!user) return

    fetchCounts()
    subscribe()

    return () => {
      unsubscribe()
    }
  }, [user, fetchCounts, subscribe, unsubscribe])

  // Subscribe to squad notifications (pending RSVPs)
  useEffect(() => {
    if (!user) return

    fetchPendingCounts()
    subscribeSquad()

    return () => {
      unsubscribeSquad()
    }
  }, [user, fetchPendingCounts, subscribeSquad, unsubscribeSquad])

  // OPTIMIZED: Memoize route checks
  const isAuthPage = location.pathname === '/auth'
  const isOnboarding = location.pathname === '/onboarding'
  const isLanding = location.pathname === '/'
  const isPublicPage = ['/legal', '/help', '/premium'].includes(location.pathname)
  // Show nav for all pages except auth/onboarding/landing. Public pages get nav only if user is logged in.
  const shouldHideNav = isAuthPage || isOnboarding || isLanding || (isPublicPage && !user)

  // OPTIMIZED: Memoize computed values
  const isPartyActive = useMemo(() => location.pathname === '/party', [location.pathname])
  const currentPath = location.pathname

  if (shouldHideNav) {
    return <>{children}</>
  }

  return (
    <div className="h-[100dvh] bg-bg-base flex overflow-hidden">
      {/* Skip to main content link - PHASE 6.1 Accessibility */}
      <a href="#main-content" className="skip-link">
        Aller au contenu principal
      </a>

      {/* Sidebar - Desktop only - Collapsible */}
      <motion.aside
        aria-label="Navigation principale"
        className="hidden lg:flex flex-col border-r border-surface-card bg-bg-base fixed h-full z-40 overflow-hidden"
        initial={false}
        animate={{ width: isExpanded ? 256 : 72 }}
        transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Logo — pr-10 to account for the pin button */}
        <div className={`${isExpanded ? 'pl-5 pr-10 py-5' : 'p-4'} border-b border-surface-card`}>
          <div className="flex items-center gap-2.5">
            <SquadPlannerLogo size={32} className="flex-shrink-0" />
            <AnimatePresence mode="wait">
              {isExpanded && (
                <motion.div
                  key="logo-text"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="text-md font-bold text-text-primary whitespace-nowrap">Squad Planner</div>
                  <div className="text-sm text-text-tertiary whitespace-nowrap">Jouez ensemble, vraiment</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Pin button - Only visible when expanded */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute top-4 right-3"
            >
              <Tooltip content={sidebarPinned ? 'Détacher la sidebar' : 'Épingler la sidebar'} position="bottom" delay={300}>
                <motion.button
                  type="button"
                  onClick={togglePinned}
                  className={`p-1.5 rounded-lg transition-colors ${
                    sidebarPinned
                      ? 'bg-primary-15 text-primary'
                      : 'text-text-tertiary hover:bg-border-subtle hover:text-text-secondary'
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label={sidebarPinned ? 'Détacher la sidebar' : 'Épingler la sidebar'}
                >
                  {sidebarPinned ? <PinOff className="w-4 h-4" aria-hidden="true" /> : <Pin className="w-4 h-4" aria-hidden="true" />}
                </motion.button>
              </Tooltip>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick action - PHASE 3.1: Opens modal directly */}
        <div className={isExpanded ? 'p-4' : 'p-2'}>
          {!isExpanded ? (
            <Tooltip content="Nouvelle session" position="right" delay={300}>
              <motion.button
                type="button"
                onClick={() => openCreateSessionModal()}
                className="flex items-center justify-center gap-2 w-10 h-10 mx-auto rounded-xl bg-primary text-white text-md font-semibold"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.25 }}
                aria-label="Créer une nouvelle session"
              >
                <Plus className="w-4 h-4 flex-shrink-0" />
              </motion.button>
            </Tooltip>
          ) : (
            <motion.button
              type="button"
              onClick={() => openCreateSessionModal()}
              className="flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-primary text-white text-md font-semibold"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.25 }}
              aria-label="Créer une nouvelle session"
            >
              <Plus className="w-4 h-4 flex-shrink-0" />
              <motion.span
                key="btn-text"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                transition={{ duration: 0.15 }}
                className="whitespace-nowrap overflow-hidden"
              >
                Nouvelle session
              </motion.span>
            </motion.button>
          )}
        </div>

        {/* Navigation */}
        <nav aria-label="Menu principal" className={`flex-1 ${isExpanded ? 'px-3' : 'px-2'} py-4 space-y-1`}>
          {navItems.map((item) => {
            // Determine badge count based on path
            let badgeCount: number | undefined
            if (item.path === '/messages' && unreadMessages > 0) {
              badgeCount = unreadMessages
            } else if (item.path === '/squads' && pendingRsvpCount > 0) {
              badgeCount = pendingRsvpCount
            }

            // Tour guide data attributes
            const tourId = item.path === '/squads' ? 'squads'
              : item.path === '/messages' ? 'messages'
              : item.path === '/party' ? 'party'
              : item.path === '/home' ? 'sessions'
              : undefined

            return (
              <div key={item.path} data-tour={tourId}>
                <NavLink
                  path={item.path}
                  icon={item.icon}
                  label={item.label}
                  isActive={currentPath === item.path}
                  badge={badgeCount}
                  collapsed={!isExpanded}
                  userId={user?.id}
                />
              </div>
            )
          })}
        </nav>

        {/* Secondary navigation - Settings, Help, Call History */}
        <div className={`${isExpanded ? 'px-3' : 'px-2'} pb-2 space-y-0.5`}>
          <NavLink
            path="/settings"
            icon={Settings}
            label="Paramètres"
            isActive={currentPath === '/settings'}
            collapsed={!isExpanded}
            userId={user?.id}
          />
          <NavLink
            path="/help"
            icon={HelpCircle}
            label="Aide"
            isActive={currentPath === '/help'}
            collapsed={!isExpanded}
            userId={user?.id}
          />
          <NavLink
            path="/call-history"
            icon={Phone}
            label="Appels"
            isActive={currentPath === '/call-history'}
            collapsed={!isExpanded}
            userId={user?.id}
          />
        </div>

        {/* Footer section - Profile and Premium */}
        <footer className="mt-auto">
          {/* Profile section */}
          <div className={`${isExpanded ? 'p-4' : 'p-2'} border-t border-surface-card`}>
            {!isExpanded ? (
              <Tooltip content={profile?.username || 'Mon profil'} position="right" delay={300}>
                <Link to="/profile" aria-label="Voir mon profil">
                  <motion.div
                    className="flex items-center justify-center p-2 rounded-xl hover:bg-surface-card transition-colors duration-300"
                    whileHover={{ x: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    {profile?.avatar_url ? (
                      <img
                        src={getOptimizedAvatarUrl(profile.avatar_url, 32) || profile.avatar_url}
                        alt={profile.username || 'Avatar'}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-purple/8 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-purple" />
                      </div>
                    )}
                  </motion.div>
                </Link>
              </Tooltip>
            ) : (
              <>
                <Link to="/profile" aria-label="Voir mon profil">
                  <motion.div
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-card transition-colors duration-300"
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.25 }}
                  >
                    {profile?.avatar_url ? (
                      <img
                        src={getOptimizedAvatarUrl(profile.avatar_url, 40) || profile.avatar_url}
                        alt={profile.username || 'Avatar'}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-purple/8 flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-purple" />
                      </div>
                    )}
                    <motion.div
                      key="profile-text"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.15 }}
                      className="flex-1 min-w-0"
                    >
                      <div className="text-md font-medium text-text-primary truncate">
                        {profile?.username || 'Mon profil'}
                      </div>
                      <div className="text-sm text-text-tertiary">
                        {profile?.reliability_score || 100}% fiable
                      </div>
                    </motion.div>
                  </motion.div>
                </Link>
                {/* Phase 4.2: Status selector under profile */}
                <StatusSelector
                  onOpenCustomStatus={() => setShowCustomStatusModal(true)}
                  className="mt-1 px-1"
                />
              </>
            )}
          </div>

          {/* Premium upsell - Only when expanded */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="p-4 overflow-hidden"
              >
                <Link to="/premium" aria-label="Passer Premium - Stats avancées, IA coach, qualité audio HD">
                  <motion.div
                    className="p-4 rounded-xl bg-gradient-to-br from-primary-10 to-purple/3 border border-primary/10 cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-warning" />
                      <span className="text-base font-semibold text-text-primary">Passe Premium</span>
                    </div>
                    <p className="text-sm text-text-secondary mb-3">
                      Stats avancées, IA coach, qualité audio HD
                    </p>
                    <span className="text-sm font-semibold text-primary hover:text-purple transition-colors duration-300">
                      Découvrir →
                    </span>
                  </motion.div>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Collapsed Premium icon */}
          {!isExpanded && (
            <div className="p-2 pb-4">
              <Tooltip content="Passer Premium" position="right" delay={300}>
                <Link to="/premium" aria-label="Passer Premium">
                  <motion.div
                    className="flex items-center justify-center p-2 rounded-xl hover:bg-surface-card transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Zap className="w-5 h-5 text-warning" />
                  </motion.div>
                </Link>
              </Tooltip>
            </div>
          )}
        </footer>
      </motion.aside>

      {/* Main content - single render with responsive margin for desktop sidebar */}
      <DesktopContentWrapper isExpanded={isExpanded} isKeyboardVisible={isKeyboardVisible}>
        {/* Header with Breadcrumbs, GlobalSearch and Notifications - Desktop only */}
        <header role="banner" className="hidden lg:flex pt-4 px-6 items-center justify-between">
          <Breadcrumbs />
          <div className="flex items-center gap-2">
            <NotificationBell />
            <GlobalSearch />
          </div>
        </header>

        {/* Single render of children - fixes double rendering issue */}
        {children}
      </DesktopContentWrapper>

      {/* Bottom navigation - Mobile only */}
      <nav
        aria-label="Navigation mobile"
        className={`lg:hidden fixed bottom-0 left-0 right-0 bg-bg-base border-t border-surface-card z-50 transition-transform duration-200 ${isKeyboardVisible ? 'translate-y-full' : 'translate-y-0'}`}
      >
        <div className="flex items-center justify-around py-2 mobile-nav-padding">
          {mobileNavLeft.map((item) => (
            <MobileNavLink
              key={item.path}
              path={item.path}
              icon={item.icon}
              label={item.label}
              isActive={currentPath === item.path}
              badge={undefined}
            />
          ))}
          <PartyButton isActive={isPartyActive} hasActiveParty={isInVoiceChat} />
          {mobileNavRight.map((item) => (
            <MobileNavLink
              key={item.path}
              path={item.path}
              icon={item.icon}
              label={item.label}
              isActive={currentPath === item.path}
              badge={item.path === '/messages' && unreadMessages > 0 ? unreadMessages : undefined}
            />
          ))}
        </div>
      </nav>

      {/* Phase 4.2.3: Custom Status Modal */}
      <CustomStatusModal
        isOpen={showCustomStatusModal}
        onClose={() => setShowCustomStatusModal(false)}
      />
    </div>
  )
}
