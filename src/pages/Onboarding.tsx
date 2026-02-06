import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, UserPlus, ArrowRight, ArrowLeft, Bell, Mic,
  Check, Globe, Camera, Loader2, Copy, Gamepad2, Sparkles
} from 'lucide-react'
import Confetti from 'react-confetti'
// useNavigate removed - using window.location.href for cleaner navigation
import { Button, Card, Input } from '../components/ui'
import { useAuthStore } from '../hooks'
import { useSquadsStore } from '../hooks/useSquads'
import { supabase } from '../lib/supabase'
import { SquadPlannerIcon } from '../components/SquadPlannerLogo'

// Mini toast component
function StepToast({ message, isVisible, onClose }: { message: string; isVisible: boolean; onClose: () => void }) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 2500)
      return () => clearTimeout(timer)
    }
  }, [isVisible, onClose])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#34d399] text-[#050506] font-medium shadow-lg shadow-[rgba(52,211,153,0.15)]">
            <Sparkles className="w-5 h-5" />
            <span>{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

type OnboardingStep = 'splash' | 'squad-choice' | 'create-squad' | 'join-squad' | 'permissions' | 'profile' | 'complete'

export function Onboarding() {
  const { user, profile, refreshProfile } = useAuthStore()
  const { createSquad, joinSquad, fetchSquads, squads } = useSquadsStore()

  const [step, setStep] = useState<OnboardingStep>('splash') // Show value proposition first
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isNavigating, setIsNavigating] = useState(false) // Prevents double-clicks during transitions

  // Squad creation - empty strings to avoid browser autocomplete pollution
  const [squadName, setSquadName] = useState('')
  const [squadGame, setSquadGame] = useState('')

  // Join squad
  const [inviteCode, setInviteCode] = useState('')

  // Safe navigation function that prevents race conditions
  // Reset fields BEFORE changing step to avoid useEffect timing issues
  const navigateToStep = useCallback((newStep: OnboardingStep) => {
    if (isNavigating) return // Ignore if already navigating
    setIsNavigating(true)
    setError(null)

    // Reset form fields BEFORE changing step (not in useEffect)
    if (newStep === 'create-squad') {
      setSquadName('')
      setSquadGame('')
    } else if (newStep === 'join-squad') {
      setInviteCode('')
    }

    setStep(newStep)
    // Reset navigation lock after animation completes
    setTimeout(() => setIsNavigating(false), 400)
  }, [isNavigating])

  // Profile
  const [username, setUsername] = useState('')
  const [timezone, setTimezone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  // Permissions state
  const [notifPermission, setNotifPermission] = useState<'granted' | 'denied' | 'default'>('default')
  const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt')
  const [notifRequested, setNotifRequested] = useState(false)

  // Created squad info for redirection and recap
  const [createdSquadId, setCreatedSquadId] = useState<string | null>(null)
  const [createdSquadName, setCreatedSquadName] = useState<string | null>(null)
  const [createdSquadCode, setCreatedSquadCode] = useState<string | null>(null)

  // Celebration state
  const [showMiniConfetti, setShowMiniConfetti] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  useEffect(() => {
    if ('Notification' in window) {
      setNotifPermission(Notification.permission)
      if (Notification.permission !== 'default') {
        setNotifRequested(true)
      }
    }
  }, [])

  useEffect(() => {
    if (profile?.username) {
      setUsername(profile.username)
    }
    if (profile?.avatar_url) {
      setAvatarUrl(profile.avatar_url)
    }
  }, [profile])

  // Compress image before upload
  const compressImage = (file: File, maxWidth = 400, quality = 0.8): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        // Calculate new dimensions (max 400px, keep aspect ratio)
        let { width, height } = img
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height
        ctx?.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob)
            else reject(new Error('Compression failed'))
          },
          'image/jpeg',
          quality
        )
      }

      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = URL.createObjectURL(file)
    })
  }

  // Ref to track pending upload
  const pendingUploadRef = useRef<Promise<void> | null>(null)

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    // Check file size (max 5MB before compression)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image trop lourde (max 5MB)')
      return
    }

    // Show local preview IMMEDIATELY (no waiting)
    const localPreviewUrl = URL.createObjectURL(file)
    setAvatarUrl(localPreviewUrl)
    setUploadingAvatar(true)
    setError(null)

    // Upload in background (non-blocking)
    const uploadPromise = (async () => {
      try {
        // Compress the image
        const compressedBlob = await compressImage(file)

        // Create unique file name
        const fileName = `${user.id}-${Date.now()}.jpg`

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, compressedBlob, {
            upsert: true,
            contentType: 'image/jpeg'
          })

        if (uploadError) throw uploadError

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName)

        // Update to real URL (replace local preview)
        setAvatarUrl(publicUrl)

        // Update profile in DB
        await supabase
          .from('profiles')
          .update({
            avatar_url: publicUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)

        // Refresh profile in store
        await refreshProfile()

        // Clean up local preview URL
        URL.revokeObjectURL(localPreviewUrl)

      } catch (err) {
        console.error('Avatar upload error:', err)
        // Keep the local preview even on error, don't show error to not block user
      } finally {
        setUploadingAvatar(false)
      }
    })()

    pendingUploadRef.current = uploadPromise
  }

  const handleCreateSquad = async () => {
    if (!squadName.trim()) {
      setError('Le nom de la squad est requis')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { squad, error } = await createSquad({
        name: squadName.trim(),
        game: squadGame.trim() || 'Non défini'
      })

      setIsLoading(false)

      if (error) {
        setError(error.message)
      } else if (squad) {
        setCreatedSquadId(squad.id)
        setCreatedSquadName(squad.name)
        setCreatedSquadCode(squad.invite_code)
        // 🎉 Mini celebration
        setShowMiniConfetti(true)
        setToastMessage('🎉 Squad créée !')
        setShowToast(true)
        setTimeout(() => setShowMiniConfetti(false), 2500)
        setStep('profile') // Go to profile first, then permissions
      } else {
        setError('Erreur lors de la création')
      }
    } catch (err) {
      setIsLoading(false)
      setError('Erreur inattendue')
      console.error('Create squad error:', err)
    }
  }

  const handleJoinSquad = async () => {
    if (!inviteCode.trim()) {
      setError('Le code d\'invitation est requis')
      return
    }

    setIsLoading(true)
    setError(null)

    const { error } = await joinSquad(inviteCode.trim())

    setIsLoading(false)

    if (error) {
      setError(error.message)
    } else {
      await fetchSquads()
      // 🎉 Mini celebration
      setShowMiniConfetti(true)
      setToastMessage('🎉 Bienvenue dans la squad !')
      setShowToast(true)
      setTimeout(() => setShowMiniConfetti(false), 2500)
      setStep('profile') // Go to profile first, then permissions
    }
  }

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      setNotifPermission(permission)
      setNotifRequested(true)
    }
  }

  const requestMicPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => track.stop())
      setMicPermission('granted')
    } catch {
      setMicPermission('denied')
    }
  }

  const canProceedFromPermissions = () => {
    // Notifications must be requested OR already granted (browser remembered)
    return notifRequested || Notification.permission === 'granted'
  }

  const saveProfile = async () => {
    if (!user) return

    setIsLoading(true)
    setError(null)

    try {
      // Use update (not upsert) - profile should already exist
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          username: username.trim() || profile?.username || 'User',
          timezone,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('Profile save error:', updateError)
        setError('Erreur lors de la sauvegarde du profil')
        setIsLoading(false)
        return
      }

      // Don't wait for refreshProfile - go to permissions
      refreshProfile().catch(console.error)
      setIsLoading(false)
      setStep('permissions')
    } catch (err) {
      setIsLoading(false)
      setError('Erreur inattendue')
      console.error('Save profile error:', err)
    }
  }

  const handleComplete = async () => {
    // If we created a squad during this onboarding, go directly there
    if (createdSquadId) {
      window.location.href = `/squad/${createdSquadId}`
      return
    }

    // Otherwise, fetch fresh squads data
    await fetchSquads()

    // Get fresh state from store
    const freshSquads = useSquadsStore.getState().squads

    if (freshSquads.length > 0) {
      window.location.href = `/squad/${freshSquads[0].id}`
    } else {
      window.location.href = '/squads'
    }
  }

  const goBack = useCallback(() => {
    if (isNavigating) return
    switch (step) {
      case 'squad-choice':
        // No back from first step
        break
      case 'create-squad':
      case 'join-squad':
        navigateToStep('squad-choice')
        break
      case 'profile':
        navigateToStep('squad-choice')
        break
      case 'permissions':
        navigateToStep('profile')
        break
      default:
        break
    }
  }, [step, isNavigating, navigateToStep])

  // Animation variants - simplified for stability
  const slideVariants = {
    enter: { opacity: 0, x: 10 },
    center: { opacity: 1, x: 0, transition: { duration: 0.2 } },
    exit: { opacity: 0, x: -10, transition: { duration: 0.15 } }
  }

  return (
    <div className="h-[100dvh] bg-[#050506] flex items-center justify-center p-4 overflow-y-auto overflow-x-hidden">
      {/* Mini Confetti for step celebrations */}
      {showMiniConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={60}
          gravity={0.3}
          colors={['#6366f1', '#34d399', '#fbbf24', '#a78bfa']}
          style={{ position: 'fixed', top: 0, left: 0, zIndex: 100, pointerEvents: 'none' }}
        />
      )}

      {/* Toast */}
      <StepToast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />

      <div className="w-full max-w-lg">
        <AnimatePresence mode="wait" initial={false}>
          {/* Step 1: Splash - Proposition de valeur */}
          {step === 'splash' && (
            <motion.div
              key="splash"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="text-center"
            >
              {/* Logo */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="mb-8 flex justify-center"
              >
                <SquadPlannerIcon size={80} />
              </motion.div>

              {/* Proposition de valeur */}
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl md:text-4xl font-bold text-[#f7f8f8] mb-4 leading-tight"
              >
                Arrêtez de dire<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6366f1] to-[#a78bfa]">
                  "on verra"
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-xl text-[#8b8d90] mb-10"
              >
                Jouez vraiment ensemble.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Button
                  onClick={() => navigateToStep('squad-choice')}
                  disabled={isNavigating}
                  data-testid="start-onboarding-button"
                  className="w-full h-14 text-[16px]"
                >
                  C'est parti
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-[13px] text-[#5e6063] mt-6"
              >
                Ça prend moins de 90 secondes
              </motion.p>
            </motion.div>
          )}

          {/* Step 2: Squad Choice */}
          {step === 'squad-choice' && (
            <motion.div
              key="squad-choice"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              {/* No back button on first step */}
              <div className="h-10 mb-6" />

              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-[#f7f8f8] mb-2">
                  Ta première squad
                </h2>
                <p className="text-[#8b8d90]">
                  Une squad = tes potes + un salon vocal + un planning
                </p>
              </div>

              <div className="space-y-4">
                {/* Create Squad - Using standard button for stability */}
                <button
                  onClick={() => navigateToStep('create-squad')}
                  disabled={isNavigating}
                  data-testid="create-squad-button"
                  className="w-full p-6 rounded-2xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] hover:border-[#6366f1] hover:scale-[1.02] active:scale-[0.99] transition-all duration-200 text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-[rgba(99,102,241,0.08)] flex items-center justify-center shrink-0 group-hover:bg-[rgba(99,102,241,0.12)] transition-colors">
                      <Users className="w-7 h-7 text-[#6366f1]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-[16px] font-semibold text-[#f7f8f8] mb-1">
                        Créer une squad
                      </h3>
                      <p className="text-[14px] text-[#8b8d90]">
                        Tu invites tes amis avec un code. En 10 secondes, tout le monde est dedans.
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-[#5e6063] group-hover:text-[#6366f1] transition-colors shrink-0 mt-1" />
                  </div>
                </button>

                {/* Join Squad - Using standard button for stability */}
                <button
                  onClick={() => navigateToStep('join-squad')}
                  disabled={isNavigating}
                  data-testid="join-squad-button"
                  className="w-full p-6 rounded-2xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] hover:border-[#34d399] hover:scale-[1.02] active:scale-[0.99] transition-all duration-200 text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-[rgba(52,211,153,0.08)] flex items-center justify-center shrink-0 group-hover:bg-[rgba(52,211,153,0.12)] transition-colors">
                      <UserPlus className="w-7 h-7 text-[#34d399]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-[16px] font-semibold text-[#f7f8f8] mb-1">
                        Rejoindre une squad
                      </h3>
                      <p className="text-[14px] text-[#8b8d90]">
                        Un ami t'a donné un code ? Entre-le ici pour le rejoindre direct.
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-[#5e6063] group-hover:text-[#34d399] transition-colors shrink-0 mt-1" />
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3a: Create Squad */}
          {step === 'create-squad' && (
            <motion.div
              key="create-squad"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <button
                onClick={goBack}
                className="flex items-center gap-2 text-[#8b8d90] hover:text-[#f7f8f8] transition-colors mb-6"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </button>

              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-[rgba(99,102,241,0.08)] flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-[#6366f1]" />
                </div>
                <h2 className="text-2xl font-bold text-[#f7f8f8] mb-2">
                  Crée ta squad
                </h2>
                <p className="text-[#8b8d90]">
                  Donne-lui un nom et choisis votre jeu principal
                </p>
              </div>

              <Card>
                <div className="p-6 space-y-4">
                  <Input
                    label="Nom de la squad"
                    value={squadName}
                    onChange={(e) => setSquadName(e.target.value)}
                    placeholder="Ex: Les Ranked du Soir"
                    autoComplete="off"
                    data-testid="squad-name-input"
                    required
                  />

                  <Input
                    label="Jeu principal"
                    value={squadGame}
                    onChange={(e) => setSquadGame(e.target.value)}
                    placeholder="Ex: Valorant, LoL, CS2..."
                    autoComplete="off"
                    data-testid="squad-game-input"
                  />

                  {error && (
                    <div className="p-3 rounded-lg bg-[rgba(251,113,133,0.05)] border border-[rgba(251,113,133,0.1)]">
                      <p className="text-[#fb7185] text-sm">{error}</p>
                    </div>
                  )}

                  <Button
                    onClick={handleCreateSquad}
                    disabled={isLoading}
                    className="w-full h-12"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Création...
                      </>
                    ) : (
                      <>
                        Créer ma squad
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Step 3b: Join Squad */}
          {step === 'join-squad' && (
            <motion.div
              key="join-squad"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <button
                onClick={goBack}
                className="flex items-center gap-2 text-[#8b8d90] hover:text-[#f7f8f8] transition-colors mb-6"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </button>

              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-[rgba(52,211,153,0.08)] flex items-center justify-center mx-auto mb-4">
                  <UserPlus className="w-8 h-8 text-[#34d399]" />
                </div>
                <h2 className="text-2xl font-bold text-[#f7f8f8] mb-2">
                  Rejoins une squad
                </h2>
                <p className="text-[#8b8d90]">
                  Entre le code que ton ami t'a donné
                </p>
              </div>

              <Card>
                <div className="p-6 space-y-4">
                  <Input
                    label="Code d'invitation"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="Ex: ABC123"
                    className="text-center text-2xl tracking-widest font-mono"
                    autoComplete="off"
                    data-testid="invite-code-input"
                    maxLength={8}
                  />

                  {error && (
                    <div className="p-3 rounded-lg bg-[rgba(251,113,133,0.05)] border border-[rgba(251,113,133,0.1)]">
                      <p className="text-[#fb7185] text-sm">{error}</p>
                    </div>
                  )}

                  <Button
                    onClick={handleJoinSquad}
                    disabled={isLoading}
                    className="w-full h-12"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Connexion...
                      </>
                    ) : (
                      <>
                        Rejoindre
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Step 4: Permissions */}
          {step === 'permissions' && (
            <motion.div
              key="permissions"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <button
                onClick={goBack}
                className="flex items-center gap-2 text-[#8b8d90] hover:text-[#f7f8f8] transition-colors mb-6"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </button>

              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-[#f7f8f8] mb-2">
                  Ne rate jamais une session
                </h2>
                <p className="text-[#8b8d90]">
                  On te prévient quand ta squad t'attend
                </p>
              </div>

              <div className="space-y-4">
                {/* Notifications - OBLIGATOIRE */}
                <Card className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[rgba(251,191,36,0.08)] flex items-center justify-center shrink-0">
                      <Bell className="w-6 h-6 text-[#fbbf24]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-[15px] font-semibold text-[#f7f8f8]">
                          Notifications
                        </h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[rgba(251,191,36,0.08)] text-[#fbbf24] font-medium">
                          Requis
                        </span>
                      </div>
                      <p className="text-[13px] text-[#8b8d90] mb-3">
                        Sois prévenu quand une session est créée ou quand ta squad t'attend
                      </p>
                      {notifPermission === 'granted' ? (
                        <div className="flex items-center gap-2 text-[#34d399] text-[14px]">
                          <Check className="w-4 h-4" />
                          Activées
                        </div>
                      ) : notifPermission === 'denied' ? (
                        <p className="text-[13px] text-[#fb7185]">
                          Bloquées — active-les dans les paramètres de ton navigateur
                        </p>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={requestNotificationPermission}
                        >
                          Activer les notifications
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Microphone - OPTIONNEL */}
                <Card className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[rgba(99,102,241,0.08)] flex items-center justify-center shrink-0">
                      <Mic className="w-6 h-6 text-[#6366f1]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-[15px] font-semibold text-[#f7f8f8]">
                          Microphone
                        </h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[rgba(255,255,255,0.05)] text-[#8b8d90] font-medium">
                          Optionnel
                        </span>
                      </div>
                      <p className="text-[13px] text-[#8b8d90] mb-3">
                        Pour la party vocale avec ta squad. Tu peux activer plus tard.
                      </p>
                      {micPermission === 'granted' ? (
                        <div className="flex items-center gap-2 text-[#34d399] text-[14px]">
                          <Check className="w-4 h-4" />
                          Autorisé
                        </div>
                      ) : micPermission === 'denied' ? (
                        <p className="text-[13px] text-[#5e6063]">
                          Tu pourras l'activer plus tard dans les paramètres
                        </p>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={requestMicPermission}
                          >
                            Autoriser le micro
                          </Button>
                          <button
                            onClick={() => setMicPermission('denied')}
                            className="text-[13px] text-[#5e6063] hover:text-[#8b8d90] px-3"
                          >
                            Plus tard
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </div>

              <div className="mt-6">
                <Button
                  onClick={() => navigateToStep('complete')}
                  data-testid="permissions-continue-button"
                  className="w-full h-12"
                  disabled={!canProceedFromPermissions() || isNavigating}
                >
                  Terminer
                  <Check className="w-5 h-5 ml-2" />
                </Button>
                {!canProceedFromPermissions() && (
                  <p className="text-[12px] text-[#fbbf24] text-center mt-2">
                    Active les notifications pour continuer
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 5: Profile */}
          {step === 'profile' && (
            <motion.div
              key="profile"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <button
                onClick={goBack}
                className="flex items-center gap-2 text-[#8b8d90] hover:text-[#f7f8f8] transition-colors mb-6"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </button>

              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-[#f7f8f8] mb-2">
                  C'est toi ?
                </h2>
                <p className="text-[#8b8d90]">
                  Tes potes te reconnaîtront
                </p>
              </div>

              <Card>
                <div className="p-6 space-y-6">
                  {/* Avatar upload */}
                  <div className="flex flex-col items-center">
                    <div className="relative mb-3">
                      <div className="w-24 h-24 rounded-full bg-[rgba(99,102,241,0.08)] flex items-center justify-center overflow-hidden">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt="Avatar"
                            className="w-24 h-24 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-4xl font-bold text-[#6366f1]">
                            {username?.charAt(0).toUpperCase() || '?'}
                          </span>
                        )}
                        {uploadingAvatar && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                          </div>
                        )}
                      </div>
                      <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#6366f1] flex items-center justify-center border-2 border-[#050506] cursor-pointer hover:bg-[#4f46e5] hover:scale-[1.02] transition-all">
                        <Camera className="w-4 h-4 text-white" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                          disabled={uploadingAvatar}
                        />
                      </label>
                    </div>
                    <p className="text-[12px] text-[#5e6063]">
                      Clique sur l'icône pour changer ta photo
                    </p>
                  </div>

                  {/* Username */}
                  <Input
                    label="Pseudo"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="TonPseudo"
                    required
                  />

                  {/* Timezone */}
                  <div>
                    <label className="block text-[13px] font-medium text-[#8b8d90] mb-2">
                      <Globe className="w-4 h-4 inline mr-1.5" />
                      Fuseau horaire
                    </label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full h-11 px-4 rounded-lg bg-[#101012] border border-[rgba(255,255,255,0.1)] text-[#f7f8f8] text-[14px] focus:border-[#6366f1] outline-none [&>option]:bg-[#101012] [&>option]:text-[#f7f8f8]"
                    >
                      <option value="Europe/Paris">Europe/Paris (France)</option>
                      <option value="Europe/London">Europe/London (UK)</option>
                      <option value="Europe/Brussels">Europe/Brussels (Belgique)</option>
                      <option value="Europe/Zurich">Europe/Zurich (Suisse)</option>
                      <option value="America/Montreal">America/Montreal (Québec)</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                      <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                      <option value="Asia/Tokyo">Asia/Tokyo (Japon)</option>
                    </select>
                    <p className="text-[12px] text-[#5e6063] mt-1.5">
                      Détecté automatiquement : {Intl.DateTimeFormat().resolvedOptions().timeZone}
                    </p>
                  </div>

                  <Button
                    onClick={saveProfile}
                    disabled={isLoading || !username.trim()}
                    className="w-full h-12"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        Continuer
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Step 6: Complete with recap */}
          {step === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              {/* Confetti animation - reduced to 8 particles for better performance */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{
                      y: -20,
                      x: (i - 4) * 60,
                      opacity: 1,
                      rotate: 0
                    }}
                    animate={{
                      y: 500,
                      opacity: 0,
                      rotate: (i % 2 === 0 ? 1 : -1) * 180
                    }}
                    transition={{
                      duration: 2 + (i % 3) * 0.5,
                      delay: i * 0.08,
                      ease: "easeOut"
                    }}
                    className="absolute top-0 left-1/2"
                    style={{
                      width: 8 + (i % 3) * 4,
                      height: 8 + (i % 3) * 4,
                      backgroundColor: ['#6366f1', '#34d399', '#fbbf24', '#fb7185', '#a78bfa'][i % 5],
                      borderRadius: i % 2 === 0 ? '50%' : '2px'
                    }}
                  />
                ))}
              </div>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="w-20 h-20 rounded-full bg-[#34d399] flex items-center justify-center mx-auto mb-6"
              >
                <Check className="w-10 h-10 text-white" />
              </motion.div>

              <h2 className="text-2xl font-bold text-[#f7f8f8] mb-2">
                {createdSquadName ? `${createdSquadName} est prête !` : "C'est parti !"}
              </h2>
              <p className="text-[#8b8d90] mb-6">
                {createdSquadId
                  ? "Invite tes potes et propose une première session"
                  : squads.length > 0
                    ? `Tu as rejoint ${squads[0].name} !`
                    : "Tu peux maintenant explorer ou créer ta squad"
                }
              </p>

              {/* Squad recap card */}
              {createdSquadCode && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mb-6"
                >
                  <Card className="p-5 text-left">
                    <div className="space-y-4">
                      {/* Squad name */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[rgba(99,102,241,0.08)] flex items-center justify-center">
                          <Users className="w-5 h-5 text-[#6366f1]" />
                        </div>
                        <div>
                          <p className="text-[12px] text-[#5e6063]">Squad</p>
                          <p className="text-[15px] font-semibold text-[#f7f8f8]">{createdSquadName}</p>
                        </div>
                      </div>

                      {/* Game */}
                      {squadGame && (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[rgba(52,211,153,0.08)] flex items-center justify-center">
                            <Gamepad2 className="w-5 h-5 text-[#34d399]" />
                          </div>
                          <div>
                            <p className="text-[12px] text-[#5e6063]">Jeu</p>
                            <p className="text-[15px] font-semibold text-[#f7f8f8]">{squadGame || 'Non défini'}</p>
                          </div>
                        </div>
                      )}

                      {/* Invite code */}
                      <div className="pt-3 border-t border-[rgba(255,255,255,0.06)]">
                        <p className="text-[12px] text-[#5e6063] mb-2">Code d'invitation</p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 px-4 py-3 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] text-[18px] font-mono font-bold text-[#f7f8f8] tracking-widest text-center">
                            {createdSquadCode}
                          </code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(createdSquadCode)
                            }}
                            className="p-3 rounded-lg bg-[rgba(99,102,241,0.08)] hover:bg-[rgba(99,102,241,0.12)] hover:scale-[1.02] transition-all"
                            aria-label="Copier le code d'invitation"
                          >
                            <Copy className="w-5 h-5 text-[#6366f1]" aria-hidden="true" />
                          </button>
                        </div>
                        <p className="text-xs text-[#5e6063] mt-2">
                          Partage ce code à tes amis pour qu'ils rejoignent
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}

              <Button onClick={handleComplete} className="w-full h-14 text-[16px]">
                {createdSquadId || squads.length > 0 ? "Voir ma squad" : "Explorer"}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress indicator - Clear numbered steps */}
        {step !== 'splash' && step !== 'complete' && (
          <div className="flex justify-center items-center gap-3 mt-8">
            {[
              { key: 'squad', label: 'Squad' },
              { key: 'profile', label: 'Profil' },
              { key: 'permissions', label: 'Notifs' }
            ].map((item, i) => {
              const currentIndex = ['squad-choice', 'create-squad', 'join-squad'].includes(step) ? 0
                : step === 'profile' ? 1
                : step === 'permissions' ? 2 : -1
              const isActive = i === currentIndex
              const isCompleted = i < currentIndex
              return (
                <div key={item.key} className="flex items-center gap-3">
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-semibold transition-all ${
                        isCompleted ? 'bg-[#34d399] text-white' :
                        isActive ? 'bg-[#6366f1] text-white' :
                        'bg-[rgba(255,255,255,0.05)] text-[#5e6063]'
                      }`}
                    >
                      {isCompleted ? <Check className="w-4 h-4" /> : i + 1}
                    </div>
                    <span className={`text-xs ${isActive || isCompleted ? 'text-[#f7f8f8]' : 'text-[#5e6063]'}`}>
                      {item.label}
                    </span>
                  </div>
                  {i < 2 && (
                    <div className={`w-8 h-0.5 mb-5 ${i < currentIndex ? 'bg-[#34d399]' : 'bg-[rgba(255,255,255,0.1)]'}`} />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Onboarding
