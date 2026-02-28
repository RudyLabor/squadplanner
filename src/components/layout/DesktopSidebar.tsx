import { memo, useCallback } from 'react'
import { Link } from 'react-router'
import { m, AnimatePresence, LayoutGroup } from 'framer-motion'
import {
  Home,
  Users,
  Calendar,
  Mic,
  MessageCircle,
  User,
  Plus,
  Pin,
  PinOff,
  Settings,
  HelpCircle,
  Phone,
  Compass,
  Gift,
} from '../icons'
import { prefetchRoute } from '../../lib/queryClient'
import { SquadPlannerLogo } from '../SquadPlannerLogo'
import { Tooltip } from '../ui/Tooltip'
import { SidebarFooter } from './SidebarFooter'

// Navigation items
export const navItems = [
  { path: '/home', icon: Home, label: 'Accueil' },
  { path: '/squads', icon: Users, label: 'Squads' },
  { path: '/sessions', icon: Calendar, label: 'Sessions' },
  { path: '/party', icon: Mic, label: 'Party' },
  { path: '/messages', icon: MessageCircle, label: 'Messages' },
  { path: '/discover', icon: Compass, label: 'Découvrir' },
  { path: '/profile', icon: User, label: 'Profil' },
] as const

// PHASE 5: Track prefetched routes to avoid redundant prefetch calls
const prefetchedRoutes = new Set<string>()

// OPTIMIZED: Memoized NavLink to prevent unnecessary re-renders
export const NavLink = memo(function NavLink({
  path,
  icon: Icon,
  label,
  isActive,
  badge,
  collapsed,
  userId,
}: {
  path: string
  icon: React.ElementType
  label: string
  isActive: boolean
  badge?: number
  collapsed?: boolean
  userId?: string
}) {
  const handlePrefetch = useCallback(() => {
    if (!prefetchedRoutes.has(path)) {
      prefetchedRoutes.add(path)
      prefetchRoute(path, userId).catch(() => {})
    }
  }, [path, userId])

  return (
    <Link
      to={path}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
      onPointerEnter={handlePrefetch}
    >
      <m.div
        className={`
          relative flex items-center ${collapsed ? 'gap-2 px-2.5' : 'gap-3 px-4'} py-3 min-h-[44px] rounded-xl transition-interactive
          ${
            isActive
              ? 'text-primary-hover'
              : 'text-text-secondary hover:bg-surface-card hover:text-text-primary'
          }
        `}
        whileHover={{ x: collapsed ? 0 : 4 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.25 }}
      >
        {isActive && (
          <m.div
            layoutId="nav-active-pill"
            className="absolute inset-0 rounded-xl bg-primary-10"
            style={{ boxShadow: '0 0 24px rgba(139, 92, 246, 0.14)' }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          />
        )}
        <Icon className="relative z-10 w-5 h-5 flex-shrink-0" strokeWidth={2} />
        {collapsed ? (
          <span className="relative z-10 text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[80px]">
            {label}
          </span>
        ) : (
          <AnimatePresence mode="wait">
            <m.span
              key="label"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.15 }}
              className="relative z-10 text-base font-medium whitespace-nowrap overflow-hidden"
            >
              {label}
            </m.span>
          </AnimatePresence>
        )}
        {badge && badge > 0 && (
          <m.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-error text-white text-xs font-bold flex items-center justify-center"
          >
            {badge > 9 ? '9+' : badge}
          </m.span>
        )}
      </m.div>
    </Link>
  )
})

interface DesktopSidebarProps {
  isExpanded: boolean
  sidebarPinned: boolean
  currentPath: string
  unreadMessages: number
  pendingRsvpCount: number
  userId?: string
  profile: {
    username?: string | null
    avatar_url?: string | null
    reliability_score?: number | null
  } | null
  onMouseEnter: () => void
  onMouseLeave: () => void
  onTogglePinned: () => void
  onOpenCreateSessionModal: () => void
  onOpenCustomStatus: () => void
}

export const DesktopSidebar = memo(function DesktopSidebar({
  isExpanded,
  sidebarPinned,
  currentPath,
  unreadMessages,
  pendingRsvpCount,
  userId,
  profile,
  onMouseEnter,
  onMouseLeave,
  onTogglePinned,
  onOpenCreateSessionModal,
  onOpenCustomStatus,
}: DesktopSidebarProps) {
  return (
    <m.aside
      aria-label="Navigation principale"
      className="desktop-only flex-col border-r border-border-subtle fixed h-full z-40 overflow-hidden"
      style={{ background: 'linear-gradient(to bottom, var(--color-bg-primary), var(--color-bg-secondary))' }}
      initial={false}
      animate={{ width: isExpanded ? 256 : 140 }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Logo */}
      <div className={`${isExpanded ? 'pl-5 pr-10 py-5' : 'p-4'} border-b border-surface-card`}>
        <div className="flex items-center gap-2.5">
          <SquadPlannerLogo size={32} className="flex-shrink-0" />
          <AnimatePresence mode="wait">
            {isExpanded && (
              <m.div
                key="logo-text"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <div className="text-base font-bold text-text-primary whitespace-nowrap">
                  Squad Planner
                </div>
                <div className="text-sm text-text-tertiary whitespace-nowrap">
                  Joue avec ta squad
                </div>
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Pin button */}
      <AnimatePresence>
        {isExpanded && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute top-4 right-3"
          >
            <Tooltip
              content={sidebarPinned ? 'Détacher la sidebar' : 'Épingler la sidebar'}
              position="bottom"
              delay={300}
            >
              <m.button
                type="button"
                onClick={onTogglePinned}
                className={`p-1.5 rounded-lg transition-colors ${
                  sidebarPinned
                    ? 'bg-primary-15 text-primary'
                    : 'text-text-tertiary hover:bg-border-subtle hover:text-text-secondary'
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label={sidebarPinned ? 'Détacher la sidebar' : 'Épingler la sidebar'}
              >
                {sidebarPinned ? (
                  <PinOff className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Pin className="w-4 h-4" aria-hidden="true" />
                )}
              </m.button>
            </Tooltip>
          </m.div>
        )}
      </AnimatePresence>

      {/* Quick action */}
      <div className={isExpanded ? 'p-4' : 'p-2'}>
        {!isExpanded ? (
          <m.button
            type="button"
            onClick={() => onOpenCreateSessionModal()}
            className="flex items-center justify-center gap-2 w-full h-10 rounded-xl bg-primary-bg text-white text-xs font-semibold"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.25 }}
            aria-label="Créer une nouvelle session"
          >
            <Plus className="w-4 h-4 flex-shrink-0" />
            <span className="whitespace-nowrap">Nouveau</span>
          </m.button>
        ) : (
          <m.button
            type="button"
            onClick={() => onOpenCreateSessionModal()}
            className="flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-primary-bg text-white text-base font-semibold"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.25 }}
            aria-label="Créer une nouvelle session"
          >
            <Plus className="w-4 h-4 flex-shrink-0" />
            <m.span
              key="btn-text"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              transition={{ duration: 0.15 }}
              className="whitespace-nowrap overflow-hidden"
            >
              Nouvelle session
            </m.span>
          </m.button>
        )}
      </div>

      {/* Navigation — single scrollable area for all nav items */}
      <nav
        aria-label="Menu principal"
        className={`flex-1 min-h-0 overflow-y-auto ${isExpanded ? 'px-3' : 'px-2'} py-4 space-y-1`}
      >
        <LayoutGroup>
        {navItems.map((item) => {
          let badgeCount: number | undefined
          if (item.path === '/messages' && unreadMessages > 0) {
            badgeCount = unreadMessages
          } else if (item.path === '/squads' && pendingRsvpCount > 0) {
            badgeCount = pendingRsvpCount
          }

          const tourId =
            item.path === '/squads'
              ? 'squads'
              : item.path === '/messages'
                ? 'messages'
                : item.path === '/party'
                  ? 'party'
                  : item.path === '/home'
                    ? 'sessions'
                    : undefined

          return (
            <div key={item.path} data-tour={tourId}>
              <NavLink
                path={item.path}
                icon={item.icon}
                label={item.label}
                isActive={currentPath === item.path || currentPath.startsWith(item.path + '/')}
                badge={badgeCount}
                collapsed={!isExpanded}
                userId={userId}
              />
            </div>
          )
        })}

        {/* Separator */}
        <div className="my-3 px-2">
          <div className="h-px bg-gradient-to-r from-transparent via-border-default to-transparent" />
          {isExpanded && (
            <div className="mt-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-text-quaternary">
              Plus
            </div>
          )}
        </div>

        {/* Secondary items — inside scrollable area */}
        <NavLink
          path="/settings"
          icon={Settings}
          label="Paramètres"
          isActive={currentPath === '/settings' || currentPath.startsWith('/settings/')}
          collapsed={!isExpanded}
          userId={userId}
        />
        <NavLink
          path="/help"
          icon={HelpCircle}
          label="Aide"
          isActive={currentPath === '/help' || currentPath.startsWith('/help/')}
          collapsed={!isExpanded}
          userId={userId}
        />
        <NavLink
          path="/call-history"
          icon={Phone}
          label="Appels"
          isActive={currentPath === '/call-history' || currentPath.startsWith('/call-history/')}
          collapsed={!isExpanded}
          userId={userId}
        />
        <NavLink
          path="/referrals"
          icon={Gift}
          label="Parrainage"
          isActive={currentPath === '/referrals' || currentPath.startsWith('/referrals/')}
          collapsed={!isExpanded}
          userId={userId}
        />
        </LayoutGroup>
      </nav>

      <SidebarFooter
        isExpanded={isExpanded}
        profile={profile}
        onOpenCustomStatus={onOpenCustomStatus}
      />
    </m.aside>
  )
})
