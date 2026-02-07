import { useEffect, useState, memo, useCallback, useMemo } from 'react'
import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, Users, Mic, MessageCircle, User, Plus, Zap, Pin, PinOff } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { useAuthStore, useSquadsStore, useVoiceChatStore, useKeyboardVisible, useUnreadCountStore } from '../../hooks'
import { useCreateSessionModal } from '../CreateSessionModal'
import { getOptimizedAvatarUrl } from '../../utils/avatarUrl'
import { SquadPlannerLogo } from '../SquadPlannerLogo'
import { Breadcrumbs } from './Breadcrumbs'
import { GlobalSearch } from '../GlobalSearch'

interface AppLayoutProps {
  children: ReactNode
}

// Navigation items (Party handled separately on mobile)
const navItems = [
  { path: '/home', icon: Home, label: 'Accueil' },
  { path: '/squads', icon: Users, label: 'Squads' },
  { path: '/party', icon: Mic, label: 'Party' },
  { path: '/messages', icon: MessageCircle, label: 'Messages' },
  { path: '/profile', icon: User, label: 'Profil' },
] as const

// Mobile nav items (Party sera au centre avec un style spécial)
const mobileNavLeft = [
  { path: '/home', icon: Home, label: 'Accueil' },
  { path: '/squads', icon: Users, label: 'Squads' },
] as const

const mobileNavRight = [
  { path: '/messages', icon: MessageCircle, label: 'Messages' },
  { path: '/profile', icon: User, label: 'Profil' },
] as const

// OPTIMIZED: Memoized NavLink to prevent unnecessary re-renders
const NavLink = memo(function NavLink({ path, icon: Icon, label, isActive, badge, collapsed }: {
  path: string
  icon: React.ElementType
  label: string
  isActive: boolean
  badge?: number
  collapsed?: boolean
}) {
  return (
    <Link to={path} aria-label={label} aria-current={isActive ? 'page' : undefined} title={collapsed ? label : undefined}>
      <motion.div
        className={`
          relative flex items-center ${collapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 rounded-xl transition-interactive
          ${isActive
            ? 'bg-[rgba(99,102,241,0.08)] text-[#6366f1]'
            : 'text-[#8b8d90] hover:bg-[rgba(255,255,255,0.03)] hover:text-[#f7f8f8]'
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
              className="text-[14px] font-medium whitespace-nowrap overflow-hidden"
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
            className={`${collapsed ? 'absolute -top-1 -right-1' : 'absolute right-3'} w-5 h-5 rounded-full bg-[#fb7185] text-white text-xs font-bold flex items-center justify-center`}
          >
            {badge > 9 ? '9+' : badge}
          </motion.span>
        )}
      </motion.div>
    </Link>
  )
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
          className={`w-6 h-6 transition-colors ${isActive ? 'text-[#f7f8f8]' : 'text-[#6b6e73]'}`}
          strokeWidth={isActive ? 2 : 1.5}
          fill={isActive ? 'currentColor' : 'none'}
          aria-hidden="true"
        />
        {badge !== undefined && badge > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-[#0070d1] text-white text-xs font-bold flex items-center justify-center"
            aria-label={`${badge} non lus`}
          >
            {badge > 99 ? '99+' : badge}
          </motion.span>
        )}
      </div>
      <span className={`text-xs mt-1 transition-colors ${isActive ? 'text-[#f7f8f8]' : 'text-[#6b6e73]'}`}>
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
      className={`flex-1 lg:pb-0 overflow-y-auto overflow-x-hidden scrollbar-hide-mobile ${isKeyboardVisible ? 'pb-0' : 'pb-mobile-nav'}`}
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
              ? 'text-[#f7f8f8]'
              : hasActiveParty
                ? 'text-[#34d399]'
                : 'text-[#6b6e73]'
          }`}
          strokeWidth={isActive ? 2 : 1.5}
          fill={isActive ? 'currentColor' : 'none'}
          aria-hidden="true"
        />
        {hasActiveParty && (
          <motion.div
            className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#34d399]"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: 3 }}
            aria-hidden="true"
          />
        )}
      </div>
      <span className={`text-xs mt-1 transition-colors duration-300 ${
        isActive ? 'text-[#f7f8f8]' : hasActiveParty ? 'text-[#34d399]' : 'text-[#6b6e73]'
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

  // Sidebar collapse state
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const [sidebarPinned, setSidebarPinned] = useState(() => {
    const saved = localStorage.getItem('sidebar-pinned')
    return saved === 'true'
  })

  // Determine if sidebar should show expanded content
  const isExpanded = sidebarExpanded || sidebarPinned

  // OPTIMIZED: Memoize callbacks
  const handleMouseEnter = useCallback(() => setSidebarExpanded(true), [])
  const handleMouseLeave = useCallback(() => setSidebarExpanded(false), [])
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

  // OPTIMIZED: Memoize route checks
  const isAuthPage = location.pathname === '/auth'
  const isOnboarding = location.pathname === '/onboarding'
  const isLanding = location.pathname === '/'
  const shouldHideNav = isAuthPage || isOnboarding || isLanding

  // OPTIMIZED: Memoize computed values
  const isPartyActive = useMemo(() => location.pathname === '/party', [location.pathname])
  const currentPath = location.pathname

  if (shouldHideNav) {
    return <>{children}</>
  }

  return (
    <div className="h-[100dvh] bg-[#050506] flex overflow-hidden">
      {/* Skip to main content link - PHASE 6.1 Accessibility */}
      <a href="#main-content" className="skip-link">
        Aller au contenu principal
      </a>

      {/* Sidebar - Desktop only - Collapsible */}
      <motion.aside
        aria-label="Navigation principale"
        className="hidden lg:flex flex-col border-r border-[rgba(255,255,255,0.03)] bg-[#050506] fixed h-full z-40"
        initial={false}
        animate={{ width: isExpanded ? 256 : 72 }}
        transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Logo */}
        <div className={`${isExpanded ? 'p-6' : 'p-4'} border-b border-[rgba(255,255,255,0.03)]`}>
          <div className="flex items-center gap-3">
            <SquadPlannerLogo size={isExpanded ? 40 : 32} />
            <AnimatePresence mode="wait">
              {isExpanded && (
                <motion.div
                  key="logo-text"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden"
                >
                  <h1 className="text-[16px] font-bold text-[#f7f8f8] whitespace-nowrap">Squad Planner</h1>
                  <p className="text-xs text-[#5e6063] whitespace-nowrap">Jouez ensemble, vraiment</p>
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
              <motion.button
                onClick={togglePinned}
                className={`p-1.5 rounded-lg transition-colors ${
                  sidebarPinned
                    ? 'bg-[rgba(99,102,241,0.15)] text-[#6366f1]'
                    : 'text-[#5e6063] hover:bg-[rgba(255,255,255,0.05)] hover:text-[#8b8d90]'
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title={sidebarPinned ? 'Détacher la sidebar' : 'Épingler la sidebar'}
                aria-label={sidebarPinned ? 'Détacher la sidebar' : 'Épingler la sidebar'}
              >
                {sidebarPinned ? <PinOff className="w-4 h-4" aria-hidden="true" /> : <Pin className="w-4 h-4" aria-hidden="true" />}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick action - PHASE 3.1: Opens modal directly */}
        <div className={isExpanded ? 'p-4' : 'p-2'}>
          <motion.button
            onClick={() => openCreateSessionModal()}
            className={`flex items-center justify-center gap-2 ${isExpanded ? 'w-full h-11' : 'w-10 h-10 mx-auto'} rounded-xl bg-[#6366f1] text-white text-[14px] font-semibold`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.25 }}
            title={!isExpanded ? 'Nouvelle session' : undefined}
            aria-label="Créer une nouvelle session"
          >
            <Plus className="w-4 h-4 flex-shrink-0" />
            <AnimatePresence mode="wait">
              {isExpanded && (
                <motion.span
                  key="btn-text"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.15 }}
                  className="whitespace-nowrap overflow-hidden"
                >
                  Nouvelle session
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Navigation */}
        <nav aria-label="Menu principal" className={`flex-1 ${isExpanded ? 'px-3' : 'px-2'} py-4 space-y-1`}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              path={item.path}
              icon={item.icon}
              label={item.label}
              isActive={currentPath === item.path}
              badge={item.path === '/messages' && unreadMessages > 0 ? unreadMessages : undefined}
              collapsed={!isExpanded}
            />
          ))}
        </nav>

        {/* Footer section - Profile and Premium */}
        <footer className="mt-auto">
          {/* Profile section */}
          <div className={`${isExpanded ? 'p-4' : 'p-2'} border-t border-[rgba(255,255,255,0.03)]`}>
            <Link to="/profile" aria-label="Voir mon profil">
              <motion.div
                className={`flex items-center ${isExpanded ? 'gap-3 p-3' : 'justify-center p-2'} rounded-xl hover:bg-[rgba(255,255,255,0.03)] transition-colors duration-300`}
                whileHover={{ x: isExpanded ? 4 : 0 }}
                transition={{ duration: 0.25 }}
                title={!isExpanded ? profile?.username || 'Mon profil' : undefined}
              >
                {profile?.avatar_url ? (
                  <img
                    src={getOptimizedAvatarUrl(profile.avatar_url, isExpanded ? 40 : 32) || profile.avatar_url}
                    alt={profile.username || 'Avatar'}
                    className={`${isExpanded ? 'w-10 h-10' : 'w-8 h-8'} rounded-full object-cover flex-shrink-0`}
                    loading="lazy"
                  />
                ) : (
                  <div className={`${isExpanded ? 'w-10 h-10' : 'w-8 h-8'} rounded-full bg-[rgba(167,139,250,0.08)] flex items-center justify-center flex-shrink-0`}>
                    <User className={`${isExpanded ? 'w-5 h-5' : 'w-4 h-4'} text-[#a78bfa]`} />
                  </div>
                )}
                <AnimatePresence mode="wait">
                  {isExpanded && (
                    <motion.div
                      key="profile-text"
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.15 }}
                      className="flex-1 min-w-0 overflow-hidden"
                    >
                      <div className="text-[14px] font-medium text-[#f7f8f8] truncate">
                        {profile?.username || 'Mon profil'}
                      </div>
                      <div className="text-[12px] text-[#5e6063]">
                        {profile?.reliability_score || 100}% fiable
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
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
                    className="p-4 rounded-xl bg-gradient-to-br from-[rgba(99,102,241,0.08)] to-[rgba(167,139,250,0.03)] border border-[rgba(99,102,241,0.1)] cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-[#fbbf24]" />
                      <span className="text-[13px] font-semibold text-[#f7f8f8]">Passe Premium</span>
                    </div>
                    <p className="text-[12px] text-[#8b8d90] mb-3">
                      Stats avancées, IA coach, qualité audio HD
                    </p>
                    <span className="text-[12px] font-semibold text-[#6366f1] hover:text-[#a78bfa] transition-colors duration-300">
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
              <Link to="/premium" aria-label="Passer Premium" title="Passer Premium">
                <motion.div
                  className="flex items-center justify-center p-2 rounded-xl hover:bg-[rgba(255,255,255,0.03)] transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Zap className="w-5 h-5 text-[#fbbf24]" />
                </motion.div>
              </Link>
            </div>
          )}
        </footer>
      </motion.aside>

      {/* Main content - single render with responsive margin for desktop sidebar */}
      <DesktopContentWrapper isExpanded={isExpanded} isKeyboardVisible={isKeyboardVisible}>
        {/* Header with Breadcrumbs and GlobalSearch - Desktop only */}
        <header role="banner" className="hidden lg:flex pt-4 px-6 items-center justify-between">
          <Breadcrumbs />
          <GlobalSearch />
        </header>

        {/* Single render of children - fixes double rendering issue */}
        {children}
      </DesktopContentWrapper>

      {/* Bottom navigation - Mobile only */}
      <nav
        aria-label="Navigation mobile"
        className={`lg:hidden fixed bottom-0 left-0 right-0 bg-[#050506] border-t border-[rgba(255,255,255,0.03)] z-50 transition-transform duration-200 ${isKeyboardVisible ? 'translate-y-full' : 'translate-y-0'}`}
      >
        <div className="flex items-center justify-around py-2 mobile-nav-padding">
          {mobileNavLeft.map((item) => (
            <MobileNavLink
              key={item.path}
              path={item.path}
              icon={item.icon}
              label={item.label}
              isActive={currentPath === item.path}
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
    </div>
  )
}
