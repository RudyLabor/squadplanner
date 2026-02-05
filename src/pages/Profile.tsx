import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Trophy, Calendar, Target, Shield,
  LogOut, Edit2, Check, X, Sparkles, Zap, Camera, Loader2,
  ChevronRight, TrendingUp, Clock, Phone
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import CountUp from 'react-countup'
import { Button, Card, Input } from '../components/ui'
import { useAuthStore, useAIStore, usePremiumStore, FREE_HISTORY_DAYS } from '../hooks'
import { PremiumGate, PremiumBadge } from '../components/PremiumGate'
import { PremiumUpgradeModal } from '../components/PremiumUpgradeModal'
import { supabase } from '../lib/supabase'

// Système d'achievements
const ACHIEVEMENTS = [
  { id: 'first_step', name: 'Premier pas', icon: '👶', description: '1ère session', threshold: 1, type: 'sessions' },
  { id: 'team_player', name: 'Team Player', icon: '🤝', description: '5 sessions', threshold: 5, type: 'sessions' },
  { id: 'reliable', name: 'Fiable', icon: '⭐', description: '10 check-ins', threshold: 10, type: 'checkins' },
  { id: 'veteran', name: 'Vétéran', icon: '🏆', description: '20 sessions', threshold: 20, type: 'sessions' },
  { id: 'perfectionist', name: 'Perfectionniste', icon: '💎', description: '100% fiabilité', threshold: 100, type: 'score' },
  { id: 'legend', name: 'Légende', icon: '👑', description: '50 sessions', threshold: 50, type: 'sessions' },
]

// Système de tiers basé sur le score de fiabilité - avec next tier pour progress bar
const TIERS = [
  { name: 'Débutant', color: '#8b8d90', icon: '🎮', minScore: 0, glow: false },
  { name: 'Confirmé', color: '#5e6dd2', icon: '✓', minScore: 50, glow: false },
  { name: 'Expert', color: '#4ade80', icon: '⭐', minScore: 70, glow: false },
  { name: 'Master', color: '#8b93ff', icon: '💎', minScore: 85, glow: true },
  { name: 'Légende', color: '#f5a623', icon: '👑', minScore: 95, glow: true },
]

const getTier = (score: number) => {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (score >= TIERS[i].minScore) return { ...TIERS[i], nextTier: TIERS[i + 1] || null }
  }
  return { ...TIERS[0], nextTier: TIERS[1] }
}

export function Profile() {
  const navigate = useNavigate()
  const { user, profile, signOut, updateProfile, isLoading } = useAuthStore()
  const { aiCoachTip, fetchAICoachTip } = useAIStore()
  const { hasPremium, canAccessFeature, fetchPremiumStatus } = usePremiumStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isEditing, setIsEditing] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '')
      setBio(profile.bio || '')
    }
  }, [profile])

  // Fetch AI Coach tip on mount
  useEffect(() => {
    if (user?.id) {
      fetchAICoachTip(user.id, 'profile')
      fetchPremiumStatus()
    }
  }, [user?.id, fetchAICoachTip, fetchPremiumStatus])

  const handleSave = async () => {
    const result = await updateProfile({ username, bio })
    if (!result.error) {
      setIsEditing(false)
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
    navigate('/')
  }

  const reliabilityScore = profile?.reliability_score ?? 100
  const tier = getTier(reliabilityScore)
  const reliabilityColor = tier.color

  // Calculer les achievements débloqués
  const unlockedAchievements = ACHIEVEMENTS.filter(a => {
    const value = a.type === 'sessions'
      ? (profile?.total_sessions || 0)
      : a.type === 'checkins'
        ? (profile?.total_checkins || 0)
        : reliabilityScore
    return value >= a.threshold
  })

  const stats = [
    { icon: Calendar, label: 'Sessions', value: profile?.total_sessions || 0, color: '#f5a623' },
    { icon: Check, label: 'Check-ins', value: profile?.total_checkins || 0, color: '#4ade80' },
    { icon: Target, label: 'Niveau', value: profile?.level || 1, color: '#5e6dd2' },
    { icon: Trophy, label: 'XP', value: profile?.xp || 0, color: '#8b93ff' },
  ]

  return (
    <div className="min-h-screen bg-[#08090a] pb-28">
      {/* Hero section avec avatar */}
      <div className="relative">
        {/* Background gradient */}
        <div className="absolute inset-0 h-48 bg-gradient-to-b from-[rgba(94,109,210,0.15)] to-transparent" />

        <div className="relative px-4 md:px-6 lg:px-8 pt-8 pb-4 max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto">
          {/* Avatar central */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#5e6dd2] to-[#8b93ff] flex items-center justify-center overflow-hidden ring-4 ring-[#08090a]">
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
                className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full bg-[#5e6dd2] flex items-center justify-center border-3 border-[#08090a] hover:bg-[#4a59c2] transition-colors shadow-lg"
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
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="w-full max-w-[300px] space-y-3"
                >
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ton pseudo"
                    className="text-center"
                  />
                  <Input
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Bio (optionnel)"
                    className="text-center"
                  />
                  <div className="flex gap-2 justify-center">
                    <Button size="sm" onClick={handleSave} disabled={isLoading}>
                      <Check className="w-4 h-4" />
                      Sauver
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                      <X className="w-4 h-4" />
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
                  <h1 className="text-xl font-bold text-[#f7f8f8] mb-1">
                    {profile?.username || 'Gamer'}
                  </h1>
                  <p className="text-[14px] text-[#8b8d90] mb-1">
                    {profile?.bio || 'Pas encore de bio'}
                  </p>
                  <p className="text-[12px] text-[#5e6063] mb-3">{user?.email}</p>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[rgba(94,109,210,0.15)] text-[#8b93ff] text-[13px] font-medium hover:bg-[rgba(94,109,210,0.25)] transition-colors active:scale-95"
                  >
                    <Edit2 className="w-4 h-4" />
                    Modifier le profil
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-6 lg:px-8 max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto">
        {/* Score de fiabilité - Card principale avec Tier System */}
        <Card className={`mb-5 overflow-hidden bg-[#101012] ${tier.glow ? 'ring-2 ring-[#f5a623]/40 ring-offset-2 ring-offset-[#08090a]' : ''}`}>
          <div
            className="h-1.5"
            style={{
              background: `linear-gradient(to right, ${reliabilityColor} ${reliabilityScore}%, rgba(255,255,255,0.05) ${reliabilityScore}%)`
            }}
          />
          <div className="p-5">
            <div className="flex items-center gap-4">
              <motion.div
                className="w-14 h-14 rounded-xl flex items-center justify-center relative"
                style={{ backgroundColor: `${reliabilityColor}15` }}
                animate={tier.glow ? { scale: [1, 1.04, 1] } : {}}
                transition={{ duration: 2, repeat: 3 }}
              >
                <Shield className="w-7 h-7" style={{ color: reliabilityColor }} />
                {tier.glow && (
                  <motion.div
                    className="absolute inset-0 rounded-xl"
                    style={{ boxShadow: `0 0 20px ${reliabilityColor}40` }}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: 3 }}
                  />
                )}
              </motion.div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="text-[32px] font-bold text-[#f7f8f8]">
                    <CountUp end={reliabilityScore} duration={1.5} suffix="%" />
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
                <p className="text-[13px] text-[#5e6063]">Score de fiabilité</p>
              </div>
              {tier.glow && (
                <motion.div
                  animate={{ rotate: [0, 12, -12, 0] }}
                  transition={{ duration: 2, repeat: 3 }}
                >
                  <Sparkles className="w-5 h-5" style={{ color: reliabilityColor }} />
                </motion.div>
              )}
              {!tier.glow && <TrendingUp className="w-5 h-5 text-[#4ade80]" />}
            </div>
          </div>
        </Card>

        {/* Stats Grid - 2x2 on mobile, 4 cols on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-5">
          {stats.map(stat => (
            <Card key={stat.label} className="p-4 bg-[#101012]">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${stat.color}15` }}
                >
                  <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                </div>
                <div>
                  <div className="text-[20px] font-bold text-[#f7f8f8]">
                    <CountUp end={stat.value} duration={1.5} />
                  </div>
                  <div className="text-[12px] text-[#5e6063]">{stat.label}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* IA Coach - Basique (gratuit) */}
        <Card className={`mb-5 p-4 bg-gradient-to-br border ${
          aiCoachTip?.tone === 'celebration'
            ? 'from-[rgba(74,222,128,0.08)] to-[rgba(74,222,128,0.02)] border-[rgba(74,222,128,0.15)]'
            : aiCoachTip?.tone === 'warning'
              ? 'from-[rgba(248,113,113,0.08)] to-[rgba(248,113,113,0.02)] border-[rgba(248,113,113,0.15)]'
              : 'from-[rgba(139,147,255,0.08)] to-[rgba(139,147,255,0.02)] border-[rgba(139,147,255,0.15)]'
        }`}>
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              aiCoachTip?.tone === 'celebration'
                ? 'bg-[rgba(74,222,128,0.15)]'
                : aiCoachTip?.tone === 'warning'
                  ? 'bg-[rgba(248,113,113,0.15)]'
                  : 'bg-[rgba(139,147,255,0.15)]'
            }`}>
              <Sparkles className={`w-5 h-5 ${
                aiCoachTip?.tone === 'celebration'
                  ? 'text-[#4ade80]'
                  : aiCoachTip?.tone === 'warning'
                    ? 'text-[#f87171]'
                    : 'text-[#8b93ff]'
              }`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <h3 className="text-[14px] font-semibold text-[#f7f8f8]">Coach IA</h3>
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                  aiCoachTip?.tone === 'celebration'
                    ? 'bg-[rgba(74,222,128,0.2)] text-[#4ade80]'
                    : aiCoachTip?.tone === 'warning'
                      ? 'bg-[rgba(248,113,113,0.2)] text-[#f87171]'
                      : 'bg-[rgba(139,147,255,0.2)] text-[#8b93ff]'
                }`}>
                  {aiCoachTip?.tone === 'celebration' ? 'BRAVO' : aiCoachTip?.tone === 'warning' ? 'ATTENTION' : 'CONSEIL'}
                </span>
              </div>
              <p className={`text-[13px] leading-relaxed ${
                aiCoachTip?.tone === 'celebration'
                  ? 'text-[#4ade80]'
                  : aiCoachTip?.tone === 'warning'
                    ? 'text-[#f87171]'
                    : 'text-[#8b8d90]'
              }`}>
                {aiCoachTip?.tip || 'Prêt pour la prochaine session ? Tes potes t\'attendent !'}
              </p>
            </div>
          </div>
        </Card>

        {/* IA Coach Avancé - Premium */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-[13px] font-semibold text-[#f7f8f8] uppercase tracking-wide">
              Coach IA Avancé
            </h3>
            {!canAccessFeature('ai_coach_advanced') && <PremiumBadge small />}
          </div>
          <PremiumGate
            feature="ai_coach_advanced"
            featureLabel="Coach IA Avancé"
            fallback="lock"
          >
            <Card className="p-4 bg-gradient-to-br from-[rgba(245,166,35,0.08)] to-[rgba(245,166,35,0.02)] border-[rgba(245,166,35,0.15)]">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[rgba(245,166,35,0.15)] flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-[#f5a623]" />
                </div>
                <div className="flex-1">
                  <h4 className="text-[14px] font-medium text-[#f7f8f8] mb-1">Conseils personnalisés</h4>
                  <p className="text-[13px] text-[#8b8d90]">
                    Prédictions de disponibilité, analyse des patterns de jeu, suggestions de créneaux optimaux pour ta squad.
                  </p>
                </div>
              </div>
            </Card>
          </PremiumGate>
        </div>

        {/* Historique des appels */}
        <Card
          className="mb-5 p-4 bg-[#101012] cursor-pointer"
          hoverable
          onClick={() => navigate('/call-history')}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgba(74,222,128,0.15)] flex items-center justify-center">
              <Phone className="w-5 h-5 text-[#4ade80]" />
            </div>
            <div className="flex-1">
              <h4 className="text-[14px] font-medium text-[#f7f8f8]">Historique des appels</h4>
              <p className="text-[12px] text-[#5e6063]">Voir tous tes appels passés</p>
            </div>
            <ChevronRight className="w-5 h-5 text-[#5e6063]" />
          </div>
        </Card>

        {/* Historique - Premium */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-[13px] font-semibold text-[#f7f8f8] uppercase tracking-wide">
              Historique
            </h3>
            {!canAccessFeature('unlimited_history') && (
              <span className="text-[11px] text-[#5e6063]">
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
                <div className="w-10 h-10 rounded-xl bg-[rgba(94,109,210,0.15)] flex items-center justify-center">
                  <Clock className="w-5 h-5 text-[#5e6dd2]" />
                </div>
                <div className="flex-1">
                  <h4 className="text-[14px] font-medium text-[#f7f8f8]">Historique complet</h4>
                  <p className="text-[12px] text-[#5e6063]">Toutes tes sessions depuis le debut</p>
                </div>
              </div>
            </Card>
          </PremiumGate>
        </div>

        {/* Premium upsell - Design amélioré */}
        {!hasPremium && (
          <Card className="mb-5 overflow-hidden bg-[#101012]">
            <div className="h-1 bg-gradient-to-r from-[#5e6dd2] via-[#f5a623] to-[#4ade80]" />
            <div className="p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#f5a623] to-[#f5a623]/50 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-[16px] font-semibold text-[#f7f8f8] mb-1">
                    Passe Premium
                  </h3>
                  <p className="text-[13px] text-[#8b8d90] mb-3">
                    Stats avancées, IA coach avancé, audio HD, historique illimité
                  </p>
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-[#5e6dd2] to-[#8b93ff]"
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
          <Card className="mb-5 p-4 bg-gradient-to-br from-[rgba(245,166,35,0.1)] to-[rgba(245,166,35,0.02)] border-[rgba(245,166,35,0.2)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[rgba(245,166,35,0.2)] flex items-center justify-center">
                <Zap className="w-5 h-5 text-[#f5a623]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-[14px] font-medium text-[#f7f8f8]">Compte Premium</h3>
                  <PremiumBadge small />
                </div>
                <p className="text-[12px] text-[#5e6063]">Toutes les features sont débloquées</p>
              </div>
            </div>
          </Card>
        )}

        {/* Achievements section avec animations */}
        <Card className="mb-5 p-4 bg-[#101012]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-semibold text-[#f7f8f8]">Achievements</h3>
            <span className="text-[12px] text-[#5e6063]">{unlockedAchievements.length}/{ACHIEVEMENTS.length}</span>
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
                      ? 'bg-gradient-to-br from-[rgba(94,109,210,0.2)] to-[rgba(139,147,255,0.1)] border border-[rgba(94,109,210,0.3)]'
                      : 'bg-[rgba(255,255,255,0.03)] border border-transparent'
                  }`}
                >
                  <motion.div
                    className="text-2xl mb-1"
                    animate={isUnlocked ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 0.5 }}
                  >
                    {isUnlocked ? achievement.icon : '🔒'}
                  </motion.div>
                  <div className={`text-[11px] font-medium ${isUnlocked ? 'text-[#f7f8f8]' : 'text-[#5e6063]'}`}>
                    {achievement.name}
                  </div>
                  <div className="text-[10px] text-[#5e6063]">
                    {achievement.description}
                  </div>
                  {isUnlocked && (
                    <motion.div
                      className="absolute -top-1 -right-1 w-5 h-5 bg-[#4ade80] rounded-full flex items-center justify-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 25, delay: index * 0.1 + 0.3 }}
                    >
                      <Check className="w-3 h-3 text-[#08090a]" />
                    </motion.div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </Card>

        {/* Déconnexion - Discret en bas */}
        <button
          onClick={handleSignOut}
          className="w-full py-3 text-[14px] text-[#f87171] hover:text-[#fca5a5] transition-colors flex items-center justify-center gap-2"
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
