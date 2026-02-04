import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, Users, Mic, MessageCircle, User, Plus, Zap } from 'lucide-react'
import { useAuthStore } from '../../hooks'

interface AppLayoutProps {
  children: ReactNode
}

const navItems = [
  { path: '/', icon: Home, label: 'Accueil' },
  { path: '/squads', icon: Users, label: 'Squads' },
  { path: '/party', icon: Mic, label: 'Party' },
  { path: '/messages', icon: MessageCircle, label: 'Messages' },
  { path: '/profile', icon: User, label: 'Profil' },
]

function NavLink({ path, icon: Icon, label, isActive }: {
  path: string
  icon: React.ElementType
  label: string
  isActive: boolean
}) {
  return (
    <Link to={path}>
      <motion.div
        className={`
          flex items-center gap-3 px-4 py-3 rounded-xl transition-all
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
      </motion.div>
    </Link>
  )
}

function MobileNavLink({ path, icon: Icon, label, isActive }: {
  path: string
  icon: React.ElementType
  label: string
  isActive: boolean
}) {
  return (
    <Link to={path} className="flex-1">
      <motion.div
        className={`
          flex flex-col items-center gap-1 py-2
          ${isActive ? 'text-[#5e6dd2]' : 'text-[#5e6063]'}
        `}
        whileTap={{ scale: 0.9 }}
      >
        <Icon className="w-5 h-5" strokeWidth={isActive ? 2 : 1.5} />
        <span className="text-[10px] font-medium">{label}</span>
      </motion.div>
    </Link>
  )
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation()
  const { profile, user } = useAuthStore()

  // Don't show navigation on auth page or landing for non-logged users
  const isAuthPage = location.pathname === '/auth'
  const isLanding = location.pathname === '/' && !user

  if (isAuthPage || isLanding) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-[#08090a] flex">
      {/* Sidebar - Desktop only */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-[rgba(255,255,255,0.06)] bg-[#08090a] fixed h-full">
        {/* Logo */}
        <div className="p-6 border-b border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center gap-3">
            <img src="/favicon.svg" alt="Squad Planner" className="w-10 h-10" />
            <div>
              <h1 className="text-[16px] font-bold text-[#f7f8f8]">Squad Planner</h1>
              <p className="text-[11px] text-[#5e6063]">Jouez ensemble, vraiment</p>
            </div>
          </div>
        </div>

        {/* Quick action */}
        <div className="p-4">
          <Link to="/squads/new">
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
                  {profile?.reliability_score || 100}% fiabilité
                </div>
              </div>
            </motion.div>
          </Link>
        </div>

        {/* Premium upsell */}
        <div className="p-4">
          <motion.div
            className="p-4 rounded-xl bg-gradient-to-br from-[rgba(94,109,210,0.15)] to-[rgba(139,147,255,0.05)] border border-[rgba(94,109,210,0.2)]"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-[#f5a623]" />
              <span className="text-[13px] font-semibold text-[#f7f8f8]">Premium</span>
            </div>
            <p className="text-[12px] text-[#8b8d90] mb-3">
              IA avancée, stats complètes, historique illimité
            </p>
            <button className="text-[12px] font-semibold text-[#5e6dd2] hover:text-[#8b93ff]">
              Découvrir →
            </button>
          </motion.div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 lg:ml-64 pb-20 lg:pb-0">
        {children}
      </main>

      {/* Bottom navigation - Mobile only */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#101012] border-t border-[rgba(255,255,255,0.06)] px-2 py-1 z-50">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {navItems.map((item) => (
            <MobileNavLink
              key={item.path}
              path={item.path}
              icon={item.icon}
              label={item.label}
              isActive={location.pathname === item.path}
            />
          ))}
        </div>
      </nav>
    </div>
  )
}
