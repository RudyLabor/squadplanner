import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, Users, Mic, MessageCircle, User, Plus, Zap } from 'lucide-react'
import { useAuthStore, useSquadsStore, useVoiceChatStore } from '../../hooks'
import { SquadPlannerLogo } from '../SquadPlannerLogo'
import { supabase } from '../../lib/supabase'

interface AppLayoutProps {
  children: ReactNode
}

// Navigation items (Party handled separately on mobile)
const navItems = [
  { path: '/', icon: Home, label: 'Accueil' },
  { path: '/squads', icon: Users, label: 'Squads' },
  { path: '/party', icon: Mic, label: 'Party' },
  { path: '/messages', icon: MessageCircle, label: 'Messages' },
  { path: '/profile', icon: User, label: 'Profil' },
]

// Mobile nav items (Party sera au centre avec un style spécial)
const mobileNavLeft = [
  { path: '/', icon: Home, label: 'Accueil' },
  { path: '/squads', icon: Users, label: 'Squads' },
]

const mobileNavRight = [
  { path: '/messages', icon: MessageCircle, label: 'Messages' },
  { path: '/profile', icon: User, label: 'Profil' },
]

function NavLink({ path, icon: Icon, label, isActive, badge }: {
  path: string
  icon: React.ElementType
  label: string
  isActive: boolean
  badge?: number
}) {
  return (
    <Link to={path} aria-current={isActive ? 'page' : undefined}>
      <motion.div
        className={`
          relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all
          ${isActive
            ? 'bg-[rgba(94,109,210,0.15)] text-[#5e6dd2]'
            : 'text-[#8b8d90] hover:bg-[rgba(255,255,255,0.05)] hover:text-[#f7f8f8]'
          }
        `}
        whileHover={{ x: 4 }}
        whileTap={{ scale: 0.98 }}
      >
        <Icon className="w-5 h-5" strokeWidth={1.5} />
        <span className="text-[14px] font-medium">{label}</span>
        {badge && badge > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="absolute right-3 w-5 h-5 rounded-full bg-[#f87171] text-white text-xs font-bold flex items-center justify-center"
          >
            {badge > 9 ? '9+' : badge}
          </motion.span>
        )}
      </motion.div>
    </Link>
  )
}

function MobileNavLink({ path, icon: Icon, label, isActive, badge }: {
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
}

// Bouton Party central - style PS App
function PartyButton({ isActive, hasActiveParty }: { isActive: boolean; hasActiveParty: boolean }) {
  return (
    <Link
      to="/party"
      className="flex flex-col items-center justify-center min-w-[48px] min-h-[48px] touch-target"
      aria-label={hasActiveParty ? 'Party vocale - En cours' : 'Party vocale'}
      aria-current={isActive ? 'page' : undefined}
    >
      <div className="relative">
        <Mic
          className={`w-6 h-6 transition-colors ${
            isActive
              ? 'text-[#f7f8f8]'
              : hasActiveParty
                ? 'text-[#4ade80]'
                : 'text-[#6b6e73]'
          }`}
          strokeWidth={isActive ? 2 : 1.5}
          fill={isActive ? 'currentColor' : 'none'}
          aria-hidden="true"
        />
        {/* Indicateur party en cours */}
        {hasActiveParty && (
          <motion.div
            className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#4ade80]"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            aria-hidden="true"
          />
        )}
      </div>
      <span className={`text-xs mt-1 transition-colors ${
        isActive ? 'text-[#f7f8f8]' : hasActiveParty ? 'text-[#4ade80]' : 'text-[#6b6e73]'
      }`}>
        Party
      </span>
    </Link>
  )
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation()
  const { profile, user } = useAuthStore()
  const { squads } = useSquadsStore()
  const { isConnected: isInVoiceChat } = useVoiceChatStore()
  const [unreadMessages, setUnreadMessages] = useState(0)

  // Fetch unread messages count
  useEffect(() => {
    if (!user) return

    const fetchUnreadCount = async () => {
      // Pour l'instant, on compte les messages non lus de manière simplifiée
      // TODO: Implémenter un vrai système de tracking des messages lus
      const squadIds = squads.map(s => s.id)
      if (squadIds.length === 0) return

      // Compter les messages des dernières 24h comme "potentiellement non lus"
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('squad_id', squadIds)
        .neq('user_id', user.id)
        .gte('created_at', yesterday.toISOString())

      // Simuler des messages non lus (max 5 pour l'affichage)
      setUnreadMessages(Math.min(count || 0, 5))
    }

    fetchUnreadCount()

    // Refresh toutes les 30 secondes
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [user, squads])

  // Don't show navigation on auth, onboarding, or landing for non-logged users
  const isAuthPage = location.pathname === '/auth'
  const isOnboarding = location.pathname === '/onboarding'
  const isLanding = location.pathname === '/' && !user

  if (isAuthPage || isOnboarding || isLanding) {
    return <>{children}</>
  }

  const isPartyActive = location.pathname === '/party'
  const hasActiveParty = isInVoiceChat

  return (
    <div className="h-[100dvh] bg-[#08090a] flex overflow-hidden">
      {/* Sidebar - Desktop only */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-[rgba(255,255,255,0.06)] bg-[#08090a] fixed h-full">
        {/* Logo */}
        <div className="p-6 border-b border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center gap-3">
            <SquadPlannerLogo size={40} />
            <div>
              <h1 className="text-[16px] font-bold text-[#f7f8f8]">Squad Planner</h1>
              <p className="text-xs text-[#5e6063]">Jouez ensemble, vraiment</p>
            </div>
          </div>
        </div>

        {/* Quick action - Lien vers la page des squads */}
        <div className="p-4">
          <Link to="/squads">
            <motion.button
              className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-[#5e6dd2] text-white text-[14px] font-semibold"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="w-4 h-4" />
              Nouvelle session
            </motion.button>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              path={item.path}
              icon={item.icon}
              label={item.label}
              isActive={location.pathname === item.path}
              badge={item.path === '/messages' && unreadMessages > 0 ? unreadMessages : undefined}
            />
          ))}
        </nav>

        {/* Profile section */}
        <div className="p-4 border-t border-[rgba(255,255,255,0.06)]">
          <Link to="/profile">
            <motion.div
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-[rgba(255,255,255,0.05)] transition-colors"
              whileHover={{ x: 4 }}
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.username || 'Avatar'}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[rgba(139,147,255,0.15)] flex items-center justify-center">
                  <User className="w-5 h-5 text-[#8b93ff]" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-medium text-[#f7f8f8] truncate">
                  {profile?.username || 'Mon profil'}
                </div>
                <div className="text-[12px] text-[#5e6063]">
                  {profile?.reliability_score || 100}% fiable
                </div>
              </div>
            </motion.div>
          </Link>
        </div>

        {/* Premium upsell */}
        <div className="p-4">
          <Link to="/premium">
            <motion.div
              className="p-4 rounded-xl bg-gradient-to-br from-[rgba(94,109,210,0.15)] to-[rgba(139,147,255,0.05)] border border-[rgba(94,109,210,0.2)] cursor-pointer"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-[#f5a623]" />
                <span className="text-[13px] font-semibold text-[#f7f8f8]">Passe Premium</span>
              </div>
              <p className="text-[12px] text-[#8b8d90] mb-3">
                Stats avancées, IA coach, qualité audio HD
              </p>
              <span className="text-[12px] font-semibold text-[#5e6dd2] hover:text-[#8b93ff]">
                Découvrir →
              </span>
            </motion.div>
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 lg:ml-64 pb-24 lg:pb-0 overflow-y-auto overflow-x-hidden">
        {children}
      </main>

      {/* Bottom navigation - Mobile only - Style PS App */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#08090a] border-t border-[#18191b] z-50">
        <div className="flex items-center justify-around py-2 mobile-nav-padding">
          {/* Left side */}
          {mobileNavLeft.map((item) => (
            <MobileNavLink
              key={item.path}
              path={item.path}
              icon={item.icon}
              label={item.label}
              isActive={location.pathname === item.path}
            />
          ))}

          {/* Party button - Center */}
          <PartyButton isActive={isPartyActive} hasActiveParty={hasActiveParty} />

          {/* Right side */}
          {mobileNavRight.map((item) => (
            <MobileNavLink
              key={item.path}
              path={item.path}
              icon={item.icon}
              label={item.label}
              isActive={location.pathname === item.path}
              badge={item.path === '/messages' && unreadMessages > 0 ? unreadMessages : undefined}
            />
          ))}
        </div>
      </nav>
    </div>
  )
}
