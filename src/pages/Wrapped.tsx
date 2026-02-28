import { useState, useEffect } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { supabaseMinimal as supabase } from '../lib/supabaseMinimal'
import { Share2, ChevronLeft, ChevronRight } from '../components/icons'
import { MobilePageHeader } from '../components/layout/MobilePageHeader'

interface WrappedStats {
  totalHours: number
  sessionCount: number
  bestStreak: number
  reliabilityScore: number
  favoriteSquad: {
    name: string
    sessionsPlayed: number
  } | null
  userName: string
}

/**
 * Gaming Wrapped 2026 - Spotify Wrapped style interactive experience
 * Multi-slide animated journey showing user's gaming statistics
 */
export function Wrapped() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [stats, setStats] = useState<WrappedStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch user data on mount
  useEffect(() => {
    const fetchWrappedData = async () => {
      try {
        setIsLoading(true)
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setError('Connecte-toi pour voir ton Wrapped')
          setIsLoading(false)
          return
        }

        // Fetch profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('username, reliability_score, streak_days')
          .eq('id', user.id)
          .single()

        if (profileError) throw profileError

        // Fetch RSVPs to find sessions user attended
        const { data: rsvps } = await supabase
          .from('session_rsvps')
          .select('session_id')
          .eq('user_id', user.id)

        // Get unique session IDs
        const sessionIds = [...new Set((rsvps || []).map((r: { session_id: string }) => r.session_id))]

        // Fetch session details for attended sessions
        let totalHours = 0
        let sessionCount = sessionIds.length
        const squadSessionCounts: { [key: string]: number } = {}

        if (sessionIds.length > 0) {
          const { data: sessions } = await supabase
            .from('sessions')
            .select('id, duration_minutes, squad_id')
            .in('id', sessionIds)

          if (sessions) {
            sessions.forEach((s: { id: string; duration_minutes?: number; squad_id?: string }) => {
              totalHours += (s.duration_minutes || 120) / 60
              if (s.squad_id) {
                squadSessionCounts[s.squad_id] = (squadSessionCounts[s.squad_id] || 0) + 1
              }
            })
            sessionCount = sessions.length
          }
        }

        // Use real profile data for streak and reliability
        const bestStreak = profile?.streak_days || 0
        const reliabilityScore =
          profile?.reliability_score != null ? Math.round(profile.reliability_score) : 0

        // Find favorite squad
        let favoriteSquad: WrappedStats['favoriteSquad'] = null
        const topSquadId = Object.entries(squadSessionCounts).sort((a, b) => b[1] - a[1])[0]

        if (topSquadId) {
          const { data: squadData } = await supabase
            .from('squads')
            .select('name')
            .eq('id', topSquadId[0])
            .single()

          favoriteSquad = {
            name: squadData?.name || 'Squad',
            sessionsPlayed: topSquadId[1],
          }
        }

        setStats({
          totalHours: Math.round(totalHours * 10) / 10,
          sessionCount,
          bestStreak,
          reliabilityScore,
          favoriteSquad,
          userName: profile?.username || 'Gamer',
        })
      } catch (err) {
        if (!import.meta.env.PROD) console.error('Error fetching wrapped data:', err)
        setError('Erreur lors du chargement de tes données')
      } finally {
        setIsLoading(false)
      }
    }

    fetchWrappedData()
  }, [])

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % 5)
  }

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + 5) % 5)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') handleNextSlide()
    if (e.key === 'ArrowLeft') handlePrevSlide()
  }

  const handleShare = async () => {
    if (!stats) return

    const shareText = `🎮 Mon Gaming Wrapped 2026 : ${stats.sessionCount} sessions, ${stats.totalHours} heures, fiabilité ${stats.reliabilityScore}% ! Découvre le tien sur squadplanner.fr/wrapped`

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mon Gaming Wrapped 2026',
          text: shareText,
          url: 'https://squadplanner.fr/wrapped',
        })
      } catch (err) {
        if (!import.meta.env.PROD) console.error('Share failed:', err)
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareText)
        toast.success('Copié !')
      } catch (err) {
        if (!import.meta.env.PROD) console.error('Copy failed:', err)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <MobilePageHeader title="Gaming Wrapped 2026" onBack={() => window.history.back()} />
        <div className="flex items-center justify-center flex-1">
          <m.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-primary border-t-warning rounded-full"
          />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <MobilePageHeader title="Gaming Wrapped 2026" onBack={() => window.history.back()} />
        <div className="text-center px-4 max-w-md mx-auto">
          <p className="text-4xl mb-4">😕</p>
          <p className="text-white text-lg font-semibold mb-2">{error}</p>
          <p className="text-white/50 text-sm mb-6">Vérifie ta connexion et réessaie.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <MobilePageHeader title="Gaming Wrapped 2026" onBack={() => window.history.back()} />
        <div className="text-center px-4">
          <p className="text-white text-lg">Aucune donnée disponible</p>
        </div>
      </div>
    )
  }

  const slides = [
    // Slide 0: Intro
    {
      bg: 'from-[#1a0a33] via-[#2d1054] to-[#1a0a33]',
      content: (
        <div className="flex flex-col items-center justify-center text-center">
          <m.div
            key="intro-emoji"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, ease: 'backOut' }}
            className="text-8xl mb-6"
          >
            🎮
          </m.div>
          <m.h1
            key="intro-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-5xl sm:text-6xl font-black text-white mb-4"
          >
            Ton Gaming
            <br />
            Wrapped 2026
          </m.h1>
          <m.p
            key="intro-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-xl text-primary/70"
          >
            Tout ce que tu as accompli cette année
          </m.p>
        </div>
      ),
    },
    // Slide 1: Total hours
    {
      bg: 'from-[#0c0c2e] via-[#161640] to-[#0c0c2e]',
      content: (
        <div className="flex flex-col items-center justify-center text-center">
          <m.p
            key="hours-label"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="text-lg text-primary/60 mb-4"
          >
            Tu as joué avec ta squad pendant
          </m.p>
          <m.div
            key="hours-counter"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              duration: 0.8,
              type: 'spring',
              stiffness: 100,
              damping: 10,
            }}
            className="text-8xl sm:text-9xl font-black text-white mb-6"
          >
            {stats.totalHours}
          </m.div>
          <m.p
            key="hours-unit"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="text-2xl text-primary/60 font-bold"
          >
            heures de gaming avec tes potes
          </m.p>
        </div>
      ),
    },
    // Slide 2: Best streak
    {
      bg: 'from-orange-900 via-red-800 to-orange-900',
      content: (
        <div className="flex flex-col items-center justify-center text-center">
          <m.p
            key="streak-label"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="text-lg text-orange-200 mb-4"
          >
            Ta série la plus longue
          </m.p>
          <m.div
            key="streak-count"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              duration: 0.8,
              type: 'spring',
              stiffness: 80,
            }}
            className="relative mb-8"
          >
            <div className="text-8xl sm:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-warning to-error">
              {stats.bestStreak}
            </div>
            <m.div
              key="streak-fire"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-6xl absolute top-0 right-0"
            >
              🔥
            </m.div>
          </m.div>
          <m.p
            key="streak-text"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="text-xl text-orange-200 font-semibold"
          >
            sessions d'affilée
          </m.p>
        </div>
      ),
    },
    // Slide 3: Reliability score
    {
      bg: 'from-green-900 via-emerald-800 to-green-900',
      content: (
        <div className="flex flex-col items-center justify-center text-center">
          <m.p
            key="reliability-label"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="text-lg text-green-200 mb-8"
          >
            Score de fiabilité
          </m.p>
          <m.div
            key="reliability-circle"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              duration: 0.8,
              type: 'spring',
              stiffness: 100,
              damping: 10,
            }}
            className="relative w-64 h-64 mb-8"
          >
            {/* SVG circle progress */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
              {/* Background circle */}
              <circle
                cx="100"
                cy="100"
                r="95"
                fill="none"
                stroke="rgba(34, 197, 94, 0.2)"
                strokeWidth="8"
              />
              {/* Progress circle */}
              <m.circle
                cx="100"
                cy="100"
                r="95"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 95}`}
                initial={{ strokeDashoffset: `${2 * Math.PI * 95}` }}
                animate={{
                  strokeDashoffset: `${2 * Math.PI * 95 * (1 - stats.reliabilityScore / 100)}`,
                }}
                transition={{ duration: 2, ease: 'easeInOut' }}
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgb(134, 239, 172)" />
                  <stop offset="100%" stopColor="rgb(16, 185, 129)" />
                </linearGradient>
              </defs>
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <m.div
                key="reliability-percent"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-6xl sm:text-7xl font-black text-white"
              >
                {stats.reliabilityScore}%
              </m.div>
            </div>
          </m.div>
        </div>
      ),
    },
    // Slide 4: Favorite squad & share
    {
      bg: 'from-[#3d0a2e] via-[#2d1054] to-[#0f0830]',
      content: (
        <div className="flex flex-col items-center justify-center text-center">
          <m.p
            key="squad-label"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="text-lg text-primary/70 mb-6"
          >
            Ta squad préférée
          </m.p>
          {stats.favoriteSquad ? (
            <>
              <m.div
                key="squad-emoji"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  duration: 0.8,
                  type: 'spring',
                  stiffness: 100,
                }}
                className="text-7xl mb-6"
              >
                👥
              </m.div>
              <m.h2
                key="squad-name"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-4xl sm:text-5xl font-black text-white mb-3"
              >
                {stats.favoriteSquad.name}
              </m.h2>
              <m.p
                key="squad-members"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-lg text-primary/70 mb-8"
              >
                {stats.favoriteSquad.sessionsPlayed} session
                {stats.favoriteSquad.sessionsPlayed > 1 ? 's' : ''} jouée
                {stats.favoriteSquad.sessionsPlayed > 1 ? 's' : ''}
              </m.p>
            </>
          ) : (
            <m.p
              key="no-squad"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="text-2xl text-primary/70 mb-8"
            >
              Pas encore de squad favorite
            </m.p>
          )}

          {/* R28 — Share + Challenge CTA */}
          <m.div
            key="share-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col items-center gap-3"
          >
            <m.button
              onClick={handleShare}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-3 px-6 py-3 bg-white text-[#2d1054] rounded-full font-bold text-lg hover:bg-purple/10 transition-colors"
            >
              <Share2 className="w-5 h-5" />
              Partager mon Wrapped
            </m.button>

            <m.button
              onClick={() => {
                const challengeText = `Je te défie ! Mon Gaming Wrapped 2026 : ${stats.sessionCount} sessions, ${stats.totalHours}h jouées, ${stats.reliabilityScore}% de fiabilité. Tu peux faire mieux ? 👉 squadplanner.fr/wrapped`
                if (navigator.share) {
                  navigator.share({ title: 'Défi Gaming Wrapped', text: challengeText, url: 'https://squadplanner.fr/wrapped' }).catch(() => {})
                } else {
                  navigator.clipboard.writeText(challengeText).catch(() => {})
                }
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/20 text-white rounded-full font-semibold text-sm hover:bg-white/30 transition-colors border border-white/20"
            >
              ⚔️ Challenge tes potes
            </m.button>

            <m.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-xs text-white/40 mt-2"
            >
              Tes potes n'ont pas de compte ? Ils pourront créer le leur gratuitement.
            </m.p>
          </m.div>
        </div>
      ),
    },
  ]

  const currentSlideData = slides[currentSlide]

  return (
    <div
      className="min-h-screen bg-black overflow-hidden mesh-bg"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Gaming Wrapped 2026"
    >
      <MobilePageHeader title="Gaming Wrapped 2026" onBack={() => window.history.back()} />

      {/* Main slide area */}
      <div
        className={`relative h-screen bg-gradient-to-br ${currentSlideData.bg} flex items-center justify-center px-4 pt-20`}
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden opacity-30">
          <m.div
            animate={{ x: [0, 50, 0], y: [0, 50, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-10 right-10 w-40 h-40 bg-white rounded-full blur-3xl"
          />
          <m.div
            animate={{ x: [0, -50, 0], y: [0, -50, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute bottom-10 left-10 w-40 h-40 bg-white rounded-full blur-3xl"
          />
        </div>

        {/* Slide content */}
        <AnimatePresence mode="wait">
          <m.div
            key={currentSlide}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 flex items-center justify-center w-full h-full"
          >
            {currentSlideData.content}
          </m.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        <button
          onClick={handlePrevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors active:scale-90"
          aria-label="Slide précédent"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>

        <button
          onClick={handleNextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors active:scale-90"
          aria-label="Slide suivant"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>

        {/* Progress dots */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {slides.map((_, index) => (
            <m.button
              key={index}
              onClick={() => setCurrentSlide(index)}
              initial={{ scale: 0.8 }}
              animate={{
                scale: index === currentSlide ? 1.2 : 0.8,
                backgroundColor:
                  index === currentSlide ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0.4)',
              }}
              className="w-3 h-3 rounded-full transition-colors"
              aria-label={`Aller au slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default Wrapped
