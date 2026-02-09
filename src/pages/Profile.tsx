import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Trophy, Calendar, Target,
  LogOut, Edit2, Check, X, Sparkles, Zap, Camera, Loader2,
  ChevronRight, TrendingUp, Clock, Phone, Flame
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Confetti from 'react-confetti'
import { toast } from 'sonner'
import { Button, Card, Input, ProfileSkeleton, ProgressRing, AnimatedCounter } from '../components/ui'
import { useAuthStore, usePremiumStore, FREE_HISTORY_DAYS } from '../hooks'
import { useAICoachQuery, useChallengesQuery, useClaimChallengeXPMutation } from '../hooks/queries'
import { PremiumGate, PremiumBadge } from '../components/PremiumGate'
import { PremiumUpgradeModal } from '../components/PremiumUpgradeModal'
import { supabase } from '../lib/supabase'
import { XPBar } from '../components/XPBar'
import { LevelUpCelebration } from '../components/LevelUpCelebration'
import { Challenges } from '../components/Challenges'
import type { Challenge, UserChallenge } from '../components/Challenges'
import { StreakCounter } from '../components/StreakCounter'
import { SeasonalBadges } from '../components/SeasonalBadges'

// Systeme d'achievements
const ACHIEVEMENTS = [
  { id: 'first_step', name: 'Premier pas', icon: '👶', description: '1ère session', threshold: 1, type: 'sessions' },
  { id: 'team_player', name: 'Joueur d\'équipe', icon: '🤝', description: '5 sessions', threshold: 5, type: 'sessions' },
  { id: 'reliable', name: 'Fiable', icon: '⭐', description: '10 check-ins', threshold: 10, type: 'checkins' },
  { id: 'veteran', name: 'Vétéran', icon: '🏆', description: '20 sessions', threshold: 20, type: 'sessions' },
  { id: 'perfectionist', name: 'Perfectionniste', icon: '💎', description: '100% fiabilité', threshold: 100, type: 'score' },
  { id: 'legend', name: 'Légende', icon: '👑', description: '50 sessions', threshold: 50, type: 'sessions' },
]

// Systeme de tiers base sur le score de fiabilite - avec next tier pour progress bar
const TIERS = [
  { name: 'Debutant', color: '#8b8d90', icon: '🎮', minScore: 0, glow: false },
  { name: 'Confirme', color: '#6366f1', icon: '✓', minScore: 50, glow: false },
  { name: 'Expert', color: '#34d399', icon: '⭐', minScore: 70, glow: false },
  { name: 'Master', color: '#a78bfa', icon: '💎', minScore: 85, glow: true },
  { name: 'Légende', color: '#fbbf24', icon: '👑', minScore: 95, glow: true },
]

const getTier = (score: number) => {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (score >= TIERS[i].minScore) return { ...TIERS[i], nextTier: TIERS[i + 1] || null }
  }
  return { ...TIERS[0], nextTier: TIERS[1] }
}

// Type for challenges with user progress
type ChallengeWithProgress = Challenge & { userProgress?: UserChallenge }

export function Profile() {
  const navigate = useNavigate()
  const { user, profile, signOut, updateProfile, isLoading, isInitialized, refreshProfile } = useAuthStore()
  const { hasPremium, canAccessFeature, fetchPremiumStatus } = usePremiumStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // React Query hooks - automatic caching and deduplication
  const { data: aiCoachTip } = useAICoachQuery(user?.id, 'profile')
  const { data: challengesData, isSuccess: challengesLoaded } = useChallengesQuery()
  const claimXPMutation = useClaimChallengeXPMutation()

  // Transform challenges data to match expected format (map DB fields to component fields)
  // Deduplicate challenges by ID to prevent double rendering - wrapped in useMemo for stability
  const challenges: ChallengeWithProgress[] = useMemo(() => {
    const seenIds = new Set<string>()
    return (challengesData?.challenges || [])
      .filter(challenge => {
        if (seenIds.has(challenge.id)) return false
        seenIds.add(challenge.id)
        return true
      })
      .map(challenge => {
        const userProgress = challengesData?.userChallenges?.find(uc => uc.challenge_id === challenge.id)
        return {
          id: challenge.id,
          title: challenge.title,
          description: challenge.description || '',
          xp_reward: challenge.xp_reward,
          // Use 'type' field from DB (not 'challenge_type')
          type: (challenge.type || 'daily') as 'daily' | 'weekly' | 'seasonal' | 'achievement',
          icon: challenge.icon || 'star',
          requirements: challenge.requirements || { type: 'sessions', count: 1 },
          userProgress: userProgress ? {
            challenge_id: userProgress.challenge_id,
            progress: userProgress.progress,
            target: userProgress.target || challenge.requirements?.count || 1,
            completed_at: userProgress.completed_at,
            xp_claimed: userProgress.xp_claimed
          } : undefined
        }
      })
  }, [challengesData])

  const [isEditing, setIsEditing] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null)

  // Achievement celebration states
  const [showAchievementConfetti, setShowAchievementConfetti] = useState(false)
  const [celebratedAchievement, setCelebratedAchievement] = useState<typeof ACHIEVEMENTS[0] | null>(null)
  const previousUnlockedIdsRef = useRef<string[]>([])

  // Gamification states
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [newLevel, setNewLevel] = useState<number | null>(null)
  const previousLevelRef = useRef<number | null>(null)

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '')
      setBio(profile.bio || '')
    }
  }, [profile])

  // Fetch premium status on mount
  useEffect(() => {
    if (user?.id) {
      fetchPremiumStatus()
    }
  }, [user?.id, fetchPremiumStatus])

  // Detect level up
  useEffect(() => {
    const currentLevel = profile?.level || 1
    const previousLevel = previousLevelRef.current

    // Only trigger if we have a previous level and current level is higher
    if (previousLevel !== null && currentLevel > previousLevel) {
      setNewLevel(currentLevel)
      setShowLevelUp(true)
    }

    // Update the ref
    previousLevelRef.current = currentLevel
  }, [profile?.level])

  // Handle claiming XP for a challenge - uses React Query mutation
  const handleClaimXP = async (challengeId: string) => {
    if (!user?.id) return

    const challenge = challenges.find(c => c.id === challengeId)
    if (!challenge) return

    try {
      const xpReward = await claimXPMutation.mutateAsync(challengeId)
      if (refreshProfile) await refreshProfile()
      toast.success(`+${xpReward} XP réclamés !`, { icon: '⚡' })
    } catch (error) {
      console.error('Error claiming XP:', error)
      toast.error('Erreur lors de la réclamation des XP')
    }
  }

  const handleSave = async () => {
    const result = await updateProfile({ username, bio })
    if (!result.error) {
      setIsEditing(false)
      toast.success('Profil mis a jour')
    } else {
      toast.error('Erreur lors de la mise a jour')
    }
  }

  const compressImage = (file: File, maxWidth = 400, quality = 0.8): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        let { width, height } = img
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        canvas.width = width
        canvas.height = height
        ctx?.drawImage(img, 0, 0, width, height)
        canvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error('Compression failed')),
          'image/jpeg',
          quality
        )
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = URL.createObjectURL(file)
    })
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    if (file.size > 5 * 1024 * 1024) {
      alert('Image trop lourde (max 5MB)')
      return
    }

    const previewUrl = URL.createObjectURL(file)
    setLocalPreviewUrl(previewUrl)
    setIsUploadingPhoto(true)

    try {
      const compressedBlob = await compressImage(file)
      const fileName = `${user.id}-${Date.now()}.jpg`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, compressedBlob, { upsert: true, contentType: 'image/jpeg' })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)
      await updateProfile({ avatar_url: publicUrl })
      setLocalPreviewUrl(null)
      URL.revokeObjectURL(previewUrl)
    } catch (error) {
      console.error('Error uploading photo:', error)
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    // La redirection est geree dans signOut() avec window.location.href
  }

  // profileReady: true only when profile data has actually loaded (not defaults)
  const profileReady = !!profile && isInitialized
  const reliabilityScore = profile?.reliability_score ?? 100
  const tier = getTier(reliabilityScore)
  const reliabilityColor = tier.color

  // Calculer les achievements debloques
  const unlockedAchievements = ACHIEVEMENTS.filter(a => {
    const value = a.type === 'sessions'
      ? (profile?.total_sessions || 0)
      : a.type === 'checkins'
        ? (profile?.total_checkins || 0)
        : reliabilityScore
    return value >= a.threshold
  })

  const stats = [
    { icon: Calendar, label: 'Sessions', value: profile?.total_sessions || 0, color: '#fbbf24' },
    { icon: Check, label: 'Check-ins', value: profile?.total_checkins || 0, color: '#34d399' },
    { icon: Target, label: 'Niveau', value: profile?.level || 1, color: '#6366f1' },
    { icon: Trophy, label: 'XP', value: profile?.xp || 0, color: '#a78bfa' },
  ]

  // Detect new achievements and celebrate
  useEffect(() => {
    const currentUnlockedIds = unlockedAchievements.map(a => a.id)
    const previousIds = previousUnlockedIdsRef.current

    // Find newly unlocked achievements (present in current but not in previous)
    const newlyUnlocked = unlockedAchievements.filter(a => !previousIds.includes(a.id))

    // Only celebrate if we had previous data (not first load) and there are new achievements
    if (previousIds.length > 0 && newlyUnlocked.length > 0) {
      // Celebrate the first new achievement (or could loop through all)
      const achievement = newlyUnlocked[0]
      setCelebratedAchievement(achievement)
      setShowAchievementConfetti(true)

      // Auto-hide after 5 seconds
      setTimeout(() => {
        setShowAchievementConfetti(false)
        setTimeout(() => setCelebratedAchievement(null), 500)
      }, 5000)
    }

    // Update the ref for next comparison
    previousUnlockedIdsRef.current = currentUnlockedIds
  }, [unlockedAchievements])

  // Loading state with skeleton
  if (!isInitialized || (isLoading && !profile)) {
    return (
      <div className="min-h-0 bg-bg-base pb-6">
        <div className="relative">
          <div className="absolute inset-0 h-48 bg-gradient-to-b from-[rgba(99,102,241,0.12)] to-transparent" />
          <div className="relative px-4 md:px-6 lg:px-8 pt-8 pb-4 max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto">
            <ProfileSkeleton />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-0 bg-bg-base pb-6">
      {/* Level Up Celebration */}
      {showLevelUp && newLevel && (
        <LevelUpCelebration
          newLevel={newLevel}
          onComplete={() => {
            setShowLevelUp(false)
            setNewLevel(null)
          }}
        />
      )}

      {/* Achievement Celebration Confetti */}
      {showAchievementConfetti && typeof window !== 'undefined' && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={200}
          gravity={0.25}
          colors={['#34d399', '#6366f1', '#fbbf24', '#a78bfa', '#f7f8f8']}
          style={{ position: 'fixed', top: 0, left: 0, zIndex: 100, pointerEvents: 'none' }}
        />
      )}

      {/* Achievement Celebration Toast */}
      <AnimatePresence>
        {celebratedAchievement && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl bg-gradient-to-r from-[#6366f1]/90 to-[#a78bfa]/90 border border-[#6366f1]/40 backdrop-blur-xl shadow-lg"
          >
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
                className="text-4xl"
              >
                {celebratedAchievement.icon}
              </motion.div>
              <div>
                <motion.p
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-[12px] font-medium text-white/70 uppercase tracking-wide"
                >
                  Succès débloqué !
                </motion.p>
                <motion.p
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-[18px] font-bold text-white"
                >
                  {celebratedAchievement.name}
                </motion.p>
                <motion.p
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-[13px] text-white/80"
                >
                  {celebratedAchievement.description}
                </motion.p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero section avec avatar */}
      <div className="relative">
        {/* Background gradient */}
        <div className="absolute inset-0 h-48 bg-gradient-to-b from-[rgba(99,102,241,0.12)] to-transparent" />

        <div className="relative px-4 md:px-6 lg:px-8 pt-8 pb-4 max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto">
          {/* Avatar central */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#6366f1] to-[#a78bfa] flex items-center justify-center overflow-hidden ring-4 ring-bg-base">
                {(localPreviewUrl || profile?.avatar_url) ? (
                  <img
                    src={localPreviewUrl || profile?.avatar_url || undefined}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-white" strokeWidth={1.5} />
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto}
                aria-label="Changer la photo de profil"
                className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full bg-primary flex items-center justify-center border-3 border-bg-base hover:bg-[#4f46e5] transition-colors shadow-md"
              >
                {isUploadingPhoto ? (
                  <Loader2 className="w-4 h-4 text-white animate-spin" aria-hidden="true" />
                ) : (
                  <Camera className="w-4 h-4 text-white" aria-hidden="true" />
                )}
              </button>
            </div>

            {/* Nom et bio */}
            <AnimatePresence mode="wait">
              {isEditing ? (
                <motion.div
                  key="editing"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full max-w-[340px] p-5 rounded-2xl bg-bg-elevated border border-border-default shadow-xl space-y-4"
                >
                  <h3 className="text-[15px] font-semibold text-text-primary text-center">Modifier le profil</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[12px] text-text-tertiary mb-1">Pseudo</label>
                      <Input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Ton pseudo"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] text-text-tertiary mb-1">Bio</label>
                      <Input
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Bio (optionnel)"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end pt-1">
                    <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                      <X className="w-4 h-4" />
                      Annuler
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={isLoading}>
                      <Check className="w-4 h-4" />
                      Sauvegarder
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="display"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-center"
                >
                  <h1 className="text-2xl font-bold text-text-primary mb-1">
                    {profile?.username || 'Gamer'}
                  </h1>
                  <p className="text-[14px] text-text-tertiary mb-1">
                    {profile?.bio || 'Pas encore de bio'}
                  </p>
                  <p className="text-[12px] text-text-quaternary mb-3">{user?.email}</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/12 text-primary text-[13px] font-medium hover:bg-primary/20 transition-colors active:scale-[0.97]"
                    >
                      <Edit2 className="w-4 h-4" />
                      Modifier le profil
                    </button>
                    <button
                      onClick={() => navigate('/settings')}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-card text-text-tertiary text-[13px] font-medium hover:bg-surface-card-hover hover:text-text-primary transition-colors active:scale-[0.97]"
                    >
                      ⚙️ Paramètres
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-6 lg:px-8 max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto">
        {/* XP Bar - Below avatar section — skeleton while loading */}
        {!profileReady ? (
          <div className="mb-5 h-[52px] rounded-xl bg-surface-card animate-pulse" />
        ) : (
          <XPBar
            currentXP={profile?.xp || 0}
            level={profile?.level || 1}
            className="mb-5"
          />
        )}

        {/* Score de fiabilité - Card principale avec Tier System */}
        {!profileReady ? (
          <Card className="mb-5 overflow-hidden bg-bg-elevated">
            <div className="h-1.5 bg-surface-card" />
            <div className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-surface-card animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-8 w-24 rounded bg-surface-card animate-pulse" />
                  <div className="h-4 w-32 rounded bg-surface-card animate-pulse" />
                </div>
              </div>
            </div>
          </Card>
        ) : (
        <Card className={`mb-5 overflow-hidden bg-bg-elevated ${tier.glow ? 'ring-1 ring-[#fbbf24]/30 ring-offset-1 ring-offset-bg-base' : ''}`}>
          <div
            className="h-1.5"
            style={{
              background: `linear-gradient(to right, ${reliabilityColor} ${reliabilityScore}%, rgba(255,255,255,0.05) ${reliabilityScore}%)`
            }}
          />
          <div className="p-5">
            <div className="flex items-center gap-4">
              <ProgressRing
                value={reliabilityScore}
                size={64}
                strokeWidth={5}
                color={reliabilityColor}
                showValue={false}
              />
              <div className="flex-1">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="text-[32px] font-bold text-text-primary">
                    <AnimatedCounter end={reliabilityScore} duration={1.5} suffix="%" />
                  </span>
                  <motion.span
                    className="text-[13px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5"
                    style={{ backgroundColor: `${reliabilityColor}20`, color: reliabilityColor }}
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    <span>{tier.icon}</span>
                    <span>{tier.name}</span>
                  </motion.span>
                </div>
                <p className="text-[13px] text-text-quaternary">Score de fiabilité</p>

                {/* Progress bar to next tier */}
                {tier.nextTier && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] mb-1.5">
                      <span className="text-text-tertiary">
                        Prochain : <span style={{ color: tier.nextTier.color }}>{tier.nextTier.icon} {tier.nextTier.name}</span>
                      </span>
                      <span className="text-text-quaternary">
                        {tier.nextTier.minScore - reliabilityScore}% restants
                      </span>
                    </div>
                    <div className="relative h-2 bg-surface-card rounded-full overflow-hidden">
                      <motion.div
                        className="absolute h-full rounded-full"
                        style={{
                          background: `linear-gradient(90deg, ${reliabilityColor}, ${tier.nextTier.color})`
                        }}
                        initial={{ width: 0 }}
                        animate={{
                          width: `${((reliabilityScore - tier.minScore) / (tier.nextTier.minScore - tier.minScore)) * 100}%`
                        }}
                        transition={{ duration: 1.2, ease: "easeOut", delay: 0.5 }}
                      />
                    </div>
                  </div>
                )}

                {/* At max tier - celebration */}
                {!tier.nextTier && (
                  <motion.p
                    className="text-[12px] mt-2 flex items-center gap-1"
                    style={{ color: tier.color }}
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2, repeat: 3 }}
                  >
                    <Sparkles className="w-3 h-3" />
                    Tu as atteint le rang maximum !
                  </motion.p>
                )}
              </div>
              {tier.glow && (
                <motion.div
                  animate={{ rotate: [0, 12, -12, 0] }}
                  transition={{ duration: 2, repeat: 3 }}
                >
                  <Sparkles className="w-5 h-5" style={{ color: reliabilityColor }} />
                </motion.div>
              )}
              {!tier.glow && <TrendingUp className="w-5 h-5 text-success" />}
            </div>
          </div>
        </Card>
        )}

        {/* Stats Grid - 2x2 on mobile, 4 cols on desktop */}
        {!profileReady ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-5">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="p-4 bg-bg-elevated">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-surface-card animate-pulse" />
                  <div className="space-y-1.5">
                    <div className="h-5 w-10 rounded bg-surface-card animate-pulse" />
                    <div className="h-3 w-14 rounded bg-surface-card animate-pulse" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-5">
          {stats.map(stat => (
            <Card key={stat.label} className="p-4 bg-bg-elevated">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${stat.color}15` }}
                >
                  <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                </div>
                <div>
                  <div className="text-xl font-bold text-text-primary">
                    <AnimatedCounter end={stat.value} duration={1.5} />
                  </div>
                  <div className="text-[12px] text-text-quaternary">{stat.label}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
        )}

        {/* Activité Section - StreakCounter */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-4 h-4 text-[#f97316]" />
            <h3 className="text-[13px] font-semibold text-text-primary uppercase tracking-wide">
              Activité
            </h3>
          </div>
          <StreakCounter
            streakDays={profile?.streak_days || 0}
            lastActiveDate={profile?.streak_last_date || null}
          />
        </div>

        {/* Challenges Section */}
        {challenges.length > 0 && (
          <div className="mb-5">
            <Challenges
              challenges={challenges}
              onClaimXP={handleClaimXP}
            />
          </div>
        )}

        {/* Seasonal Badges Section - only render after challengesData loaded to avoid duplicate API call */}
        <Card className="mb-5 overflow-hidden">
          <div className="flex items-center gap-2 px-4 pt-4 pb-2">
            <Trophy className="w-4 h-4 text-warning" />
            <h3 className="text-[14px] font-semibold text-text-primary">Badges Saisonniers</h3>
          </div>
          {challengesLoaded ? (
            <SeasonalBadges initialBadges={challengesData?.badges} />
          ) : (
            <div className="p-4">
              <div className="flex gap-2">
                {[1, 2, 3].map(i => (
                  <div
                    key={i}
                    className="w-12 h-12 rounded-xl bg-surface-card animate-pulse"
                  />
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* IA Coach - Basique (gratuit) */}
        <Card className={`mb-5 p-4 bg-gradient-to-br border ${
          aiCoachTip?.tone === 'celebration'
            ? 'from-[rgba(52,211,153,0.06)] to-[rgba(52,211,153,0.02)] border-[rgba(52,211,153,0.12)]'
            : aiCoachTip?.tone === 'warning'
              ? 'from-[rgba(251,113,133,0.06)] to-[rgba(251,113,133,0.02)] border-[rgba(251,113,133,0.12)]'
              : 'from-[rgba(167,139,250,0.06)] to-[rgba(167,139,250,0.02)] border-[rgba(167,139,250,0.12)]'
        }`}>
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              aiCoachTip?.tone === 'celebration'
                ? 'bg-[rgba(52,211,153,0.12)]'
                : aiCoachTip?.tone === 'warning'
                  ? 'bg-[rgba(251,113,133,0.12)]'
                  : 'bg-[rgba(167,139,250,0.12)]'
            }`}>
              <Sparkles className={`w-5 h-5 ${
                aiCoachTip?.tone === 'celebration'
                  ? 'text-success'
                  : aiCoachTip?.tone === 'warning'
                    ? 'text-error'
                    : 'text-purple'
              }`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <h3 className="text-[14px] font-semibold text-text-primary">Coach IA</h3>
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                  aiCoachTip?.tone === 'celebration'
                    ? 'bg-[rgba(52,211,153,0.15)] text-success'
                    : aiCoachTip?.tone === 'warning'
                      ? 'bg-[rgba(251,113,133,0.15)] text-error'
                      : 'bg-[rgba(167,139,250,0.15)] text-purple'
                }`}>
                  {aiCoachTip?.tone === 'celebration' ? 'BRAVO' : aiCoachTip?.tone === 'warning' ? 'ATTENTION' : 'CONSEIL'}
                </span>
              </div>
              <p className={`text-[13px] leading-relaxed ${
                aiCoachTip?.tone === 'celebration'
                  ? 'text-success'
                  : aiCoachTip?.tone === 'warning'
                    ? 'text-error'
                    : 'text-text-tertiary'
              }`}>
                {aiCoachTip?.tip || 'Prêt pour la prochaine session ? Tes potes t\'attendent !'}
              </p>
            </div>
          </div>
        </Card>

        {/* IA Coach Avance - Premium */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-[13px] font-semibold text-text-primary uppercase tracking-wide">
              Coach IA Avancé
            </h3>
            {!canAccessFeature('ai_coach_advanced') && <PremiumBadge small />}
          </div>
          <PremiumGate
            feature="ai_coach_advanced"
            featureLabel="Coach IA Avancé"
            fallback="lock"
          >
            <Card className="p-4 bg-gradient-to-br from-[rgba(251,191,36,0.06)] to-[rgba(251,191,36,0.02)] border-[rgba(251,191,36,0.12)]">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[rgba(251,191,36,0.12)] flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-warning" />
                </div>
                <div className="flex-1">
                  <h4 className="text-[14px] font-medium text-text-primary mb-1">Conseils personnalisés</h4>
                  <p className="text-[13px] text-text-tertiary">
                    Prédictions de disponibilité, analyse des patterns de jeu, suggestions de créneaux optimaux pour ta squad.
                  </p>
                </div>
              </div>
            </Card>
          </PremiumGate>
        </div>

        {/* Historique des appels */}
        <Card
          className="mb-5 p-4 bg-bg-elevated cursor-pointer"
          hoverable
          onClick={() => navigate('/call-history')}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgba(52,211,153,0.12)] flex items-center justify-center">
              <Phone className="w-5 h-5 text-success" />
            </div>
            <div className="flex-1">
              <h4 className="text-[14px] font-medium text-text-primary">Historique des appels</h4>
              <p className="text-[12px] text-text-quaternary">Voir tous tes appels passés</p>
            </div>
            <ChevronRight className="w-5 h-5 text-text-quaternary" />
          </div>
        </Card>

        {/* Historique - Premium */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-[13px] font-semibold text-text-primary uppercase tracking-wide">
              Historique
            </h3>
            {!canAccessFeature('unlimited_history') && (
              <span className="text-xs text-text-quaternary">
                ({FREE_HISTORY_DAYS} derniers jours)
              </span>
            )}
            {!canAccessFeature('unlimited_history') && <PremiumBadge small />}
          </div>
          <PremiumGate
            feature="unlimited_history"
            featureLabel="Historique illimité"
            fallback="lock"
          >
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/12 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="text-[14px] font-medium text-text-primary">Historique complet</h4>
                  <p className="text-[12px] text-text-quaternary">Toutes tes sessions depuis le debut</p>
                </div>
              </div>
            </Card>
          </PremiumGate>
        </div>

        {/* Premium upsell - Design ameliore */}
        {!hasPremium && (
          <Card className="mb-5 overflow-hidden bg-bg-elevated">
            <div className="h-1 bg-gradient-to-r from-[#6366f1] via-[#fbbf24] to-[#34d399]" />
            <div className="p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#fbbf24] to-[#fbbf24]/50 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-[16px] font-semibold text-text-primary mb-1">
                    Passe Premium
                  </h3>
                  <p className="text-[13px] text-text-tertiary mb-3">
                    Stats avancées, IA coach avancé, audio HD, historique illimité
                  </p>
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-[#6366f1] to-[#a78bfa]"
                    onClick={() => navigate('/premium')}
                  >
                    Découvrir
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Badge Premium si actif */}
        {hasPremium && (
          <Card className="mb-5 p-4 bg-gradient-to-br from-[rgba(251,191,36,0.08)] to-[rgba(251,191,36,0.02)] border-[rgba(251,191,36,0.15)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[rgba(251,191,36,0.15)] flex items-center justify-center">
                <Zap className="w-5 h-5 text-warning" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-[14px] font-medium text-text-primary">Compte Premium</h3>
                  <PremiumBadge small />
                </div>
                <p className="text-[12px] text-text-quaternary">Toutes les features sont debloquees</p>
              </div>
            </div>
          </Card>
        )}

        {/* Achievements section avec animations */}
        <Card className="mb-5 p-4 bg-bg-elevated">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-semibold text-text-primary">Succès</h3>
            <span className="text-[12px] text-text-quaternary">{unlockedAchievements.length}/{ACHIEVEMENTS.length}</span>
          </div>
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
            {ACHIEVEMENTS.map((achievement, index) => {
              const isUnlocked = unlockedAchievements.some(a => a.id === achievement.id)
              return (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative p-3 rounded-xl text-center ${
                    isUnlocked
                      ? 'bg-gradient-to-br from-[rgba(99,102,241,0.15)] to-[rgba(167,139,250,0.08)] border border-[rgba(99,102,241,0.2)]'
                      : 'bg-surface-card border border-transparent'
                  }`}
                >
                  <motion.div
                    className="text-2xl mb-1"
                    animate={isUnlocked ? { scale: [1, 1.04, 1] } : {}}
                    transition={{ duration: 0.5 }}
                  >
                    {isUnlocked ? achievement.icon : '🔒'}
                  </motion.div>
                  <div className={`text-xs font-medium ${isUnlocked ? 'text-text-primary' : 'text-text-quaternary'}`}>
                    {achievement.name}
                  </div>
                  <div className="text-xs text-text-quaternary">
                    {achievement.description}
                  </div>
                  {isUnlocked && (
                    <motion.div
                      className="absolute -top-1 -right-1 w-5 h-5 bg-success rounded-full flex items-center justify-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 25, delay: index * 0.1 + 0.3 }}
                    >
                      <Check className="w-3 h-3 text-bg-base" />
                    </motion.div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </Card>

        {/* Deconnexion - Discret en bas */}
        <button
          onClick={handleSignOut}
          className="w-full py-3 text-[14px] text-error hover:text-[#fda4af] transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Se déconnecter
        </button>
      </div>

      {/* Modal Premium */}
      <PremiumUpgradeModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        feature="Compte Premium"
      />
    </div>
  )
}
