import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Trophy, Calendar, Target, Shield,
  LogOut, Edit2, Check, X, Sparkles, Zap, Camera, Loader2,
  ChevronRight, TrendingUp, Award, Clock
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Confetti from 'react-confetti'
import CountUp from 'react-countup'
import { Button, Card, Input } from '../components/ui'
import { useAuthStore, useAIStore, usePremiumStore, FREE_HISTORY_DAYS } from '../hooks'
import { PremiumGate, PremiumBadge } from '../components/PremiumGate'
import { PremiumUpgradeModal } from '../components/PremiumUpgradeModal'
import { supabase } from '../lib/supabase'

export function Profile() {
  const navigate = useNavigate()
  const { user, profile, signOut, updateProfile, isLoading } = useAuthStore()
  const { aiCoachTip, aiCoachTipLoading, fetchAICoachTip } = useAIStore()
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

  const reliabilityScore = profile?.reliability_score || 100
  const reliabilityColor = reliabilityScore >= 80 ? '#4ade80' : reliabilityScore >= 50 ? '#f5a623' : '#f87171'
  const reliabilityLabel = reliabilityScore >= 90 ? 'Excellent' : reliabilityScore >= 70 ? 'Bon' : reliabilityScore >= 50 ? 'Moyen' : 'À améliorer'

  const stats = [
    { icon: Calendar, label: 'Sessions', value: profile?.total_sessions || 0, color: '#f5a623' },
    { icon: Check, label: 'Check-ins', value: profile?.total_checkins || 0, color: '#4ade80' },
    { icon: Target, label: 'Niveau', value: profile?.level || 1, color: '#5e6dd2' },
    { icon: Trophy, label: 'XP', value: profile?.xp || 0, color: '#8b93ff' },
  ]

  return (
    <div className="min-h-screen bg-[#08090a] pb-28">
      {/* Confetti for 100% reliability score */}
      {reliabilityScore >= 100 && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={200}
        />
      )}

      {/* Hero section avec avatar */}
      <div className="relative">
        {/* Background gradient */}
        <div className="absolute inset-0 h-48 bg-gradient-to-b from-[rgba(94,109,210,0.15)] to-transparent" />

        <div className="relative px-4 md:px-6 pt-8 pb-4 max-w-2xl mx-auto">
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
                className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full bg-[#5e6dd2] flex items-center justify-center border-3 border-[#08090a] hover:bg-[#4a59c2] transition-colors shadow-lg"
              >
                {isUploadingPhoto ? (
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                ) : (
                  <Camera className="w-4 h-4 text-white" />
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
                  <button
                    onClick={() => setIsEditing(true)}
                    className="group flex items-center gap-2 mx-auto mb-1"
                  >
                    <h1 className="text-[22px] font-bold text-[#f7f8f8]">
                      {profile?.username || 'Gamer'}
                    </h1>
                    <Edit2 className="w-4 h-4 text-[#5e6063] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                  <p className="text-[14px] text-[#8b8d90] mb-1">
                    {profile?.bio || 'Pas encore de bio'}
                  </p>
                  <p className="text-[12px] text-[#5e6063]">{user?.email}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-6 max-w-2xl mx-auto">
        {/* Score de fiabilité - Card principale */}
        <Card className="mb-5 overflow-hidden bg-[#0c0d0e]">
          <div
            className="h-1"
            style={{
              background: `linear-gradient(to right, ${reliabilityColor} ${reliabilityScore}%, rgba(255,255,255,0.05) ${reliabilityScore}%)`
            }}
          />
          <div className="p-5">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${reliabilityColor}15` }}
              >
                <Shield className="w-7 h-7" style={{ color: reliabilityColor }} />
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="text-[32px] font-bold text-[#f7f8f8]">
                    <CountUp end={reliabilityScore} duration={1.5} suffix="%" />
                  </span>
                  <span
                    className="text-[13px] font-medium px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${reliabilityColor}20`, color: reliabilityColor }}
                  >
                    {reliabilityLabel}
                  </span>
                </div>
                <p className="text-[13px] text-[#5e6063]">Score de fiabilité</p>
              </div>
              <TrendingUp className="w-5 h-5 text-[#4ade80]" />
            </div>
          </div>
        </Card>

        {/* Stats Grid - 2x2 */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {stats.map(stat => (
            <Card key={stat.label} className="p-4 bg-[#0c0d0e]">
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
              {aiCoachTipLoading ? (
                <Loader2 className="w-5 h-5 text-[#8b93ff] animate-spin" />
              ) : (
                <Sparkles className={`w-5 h-5 ${
                  aiCoachTip?.tone === 'celebration'
                    ? 'text-[#4ade80]'
                    : aiCoachTip?.tone === 'warning'
                      ? 'text-[#f87171]'
                      : 'text-[#8b93ff]'
                }`} />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <h3 className="text-[14px] font-semibold text-[#f7f8f8]">Coach IA</h3>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
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
                {aiCoachTipLoading ? (
                  'Analyse de ton profil en cours...'
                ) : (
                  aiCoachTip?.tip || 'Pret pour la prochaine session ? Tes potes t\'attendent !'
                )}
              </p>
            </div>
          </div>
        </Card>

        {/* IA Coach Avance - Premium */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-[13px] font-semibold text-[#f7f8f8] uppercase tracking-wide">
              Coach IA Avance
            </h3>
            {!canAccessFeature('ai_coach_advanced') && <PremiumBadge small />}
          </div>
          <PremiumGate
            feature="ai_coach_advanced"
            featureLabel="Coach IA Avance"
            fallback="lock"
          >
            <Card className="p-4 bg-gradient-to-br from-[rgba(245,166,35,0.08)] to-[rgba(245,166,35,0.02)] border-[rgba(245,166,35,0.15)]">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[rgba(245,166,35,0.15)] flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-[#f5a623]" />
                </div>
                <div className="flex-1">
                  <h4 className="text-[14px] font-medium text-[#f7f8f8] mb-1">Conseils personnalises</h4>
                  <p className="text-[13px] text-[#8b8d90]">
                    Predictions de disponibilite, analyse des patterns de jeu, suggestions de creneaux optimaux pour ta squad.
                  </p>
                </div>
              </div>
            </Card>
          </PremiumGate>
        </div>

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
            featureLabel="Historique illimite"
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
          <Card className="mb-5 overflow-hidden bg-[#0c0d0e]">
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
                    Stats avancees, IA coach avance, audio HD, historique illimite
                  </p>
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-[#5e6dd2] to-[#8b93ff]"
                    onClick={() => setShowPremiumModal(true)}
                  >
                    Decouvrir
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
                <p className="text-[12px] text-[#5e6063]">Toutes les features sont debloquees</p>
              </div>
            </div>
          </Card>
        )}

        {/* Badges section */}
        <Card className="mb-5 p-4 bg-[#0c0d0e]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[14px] font-semibold text-[#f7f8f8]">Badges</h3>
            <span className="text-[12px] text-[#5e6063]">1/12</span>
          </div>
          <div className="flex gap-3">
            {/* Badge Early Adopter */}
            <div className="w-12 h-12 rounded-xl bg-[rgba(94,109,210,0.15)] flex items-center justify-center">
              <Award className="w-6 h-6 text-[#5e6dd2]" />
            </div>
            {/* Badges verrouillés */}
            {[1, 2, 3].map(i => (
              <div key={i} className="w-12 h-12 rounded-xl bg-[rgba(255,255,255,0.03)] flex items-center justify-center">
                <Award className="w-6 h-6 text-[#2a2b2e]" />
              </div>
            ))}
            <button className="w-12 h-12 rounded-xl bg-[rgba(255,255,255,0.03)] flex items-center justify-center hover:bg-[rgba(255,255,255,0.05)] transition-colors">
              <ChevronRight className="w-5 h-5 text-[#5e6063]" />
            </button>
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
