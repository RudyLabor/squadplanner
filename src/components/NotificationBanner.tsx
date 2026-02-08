import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, CheckCircle2, AlertTriangle, Info, Trophy, RefreshCw } from 'lucide-react'
import { useNotificationBannerStore, type BannerType } from '../hooks/useNotificationBanner'

const bannerConfig: Record<BannerType, {
  bg: string
  border: string
  icon: typeof Info
  iconColor: string
}> = {
  info: {
    bg: 'bg-[#6366f1]/10',
    border: 'border-[#6366f1]/20',
    icon: Info,
    iconColor: '#6366f1',
  },
  success: {
    bg: 'bg-[#34d399]/10',
    border: 'border-[#34d399]/20',
    icon: CheckCircle2,
    iconColor: '#34d399',
  },
  warning: {
    bg: 'bg-[#fbbf24]/10',
    border: 'border-[#fbbf24]/20',
    icon: AlertTriangle,
    iconColor: '#fbbf24',
  },
  achievement: {
    bg: 'bg-gradient-to-r from-[#8b5cf6]/10 to-[#ec4899]/10',
    border: 'border-[#a78bfa]/20',
    icon: Trophy,
    iconColor: '#a78bfa',
  },
  update: {
    bg: 'bg-[#38bdf8]/10',
    border: 'border-[#38bdf8]/20',
    icon: RefreshCw,
    iconColor: '#38bdf8',
  },
}

export default function NotificationBanner() {
  const { banners, dismissBanner } = useNotificationBannerStore()
  const activeBanner = banners[0]

  useEffect(() => {
    if (!activeBanner || activeBanner.persistent) return
    const timer = setTimeout(() => {
      dismissBanner(activeBanner.id)
    }, activeBanner.duration ?? 8000)
    return () => clearTimeout(timer)
  }, [activeBanner, dismissBanner])

  return (
    <AnimatePresence>
      {activeBanner && (
        <motion.div
          key={activeBanner.id}
          role="alert"
          aria-live="polite"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={`fixed top-0 left-0 right-0 z-[9998] px-4 pt-[env(safe-area-inset-top,0px)]`}
        >
          <div className={`max-w-xl mx-auto mt-3 px-4 py-3 rounded-xl border backdrop-blur-sm ${bannerConfig[activeBanner.type].bg} ${bannerConfig[activeBanner.type].border}`}>
            <div className="flex items-start gap-3">
              {(() => {
                const Icon = activeBanner.icon || bannerConfig[activeBanner.type].icon
                return <Icon className="w-5 h-5 shrink-0 mt-0.5" style={{ color: bannerConfig[activeBanner.type].iconColor }} />
              })()}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary">{activeBanner.title}</p>
                {activeBanner.message && (
                  <p className="text-xs text-text-secondary mt-0.5">{activeBanner.message}</p>
                )}
                {activeBanner.actions && activeBanner.actions.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {activeBanner.actions.map((action) => (
                      <button
                        key={action.label}
                        onClick={() => {
                          action.onClick()
                          dismissBanner(activeBanner.id)
                        }}
                        className={`text-xs font-medium px-3 py-1 rounded-lg transition-colors ${
                          action.variant === 'primary'
                            ? 'bg-primary text-white hover:bg-primary/80'
                            : 'bg-white/10 text-text-primary hover:bg-white/15'
                        }`}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {activeBanner.dismissible !== false && (
                <button
                  onClick={() => dismissBanner(activeBanner.id)}
                  className="text-text-tertiary hover:text-text-primary transition-colors p-0.5"
                  aria-label="Fermer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
