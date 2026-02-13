'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router'
import Confetti from '../components/LazyConfetti'
import { useAuthStore } from '../hooks'
import { useSquadsStore } from '../hooks/useSquads'
import { supabaseMinimal as supabase } from '../lib/supabaseMinimal'
import { StepToast } from './onboarding/StepToast'
import { OnboardingStepSplash } from './onboarding/OnboardingStepSplash'
import { OnboardingStepSquadChoice } from './onboarding/OnboardingStepSquadChoice'
import { OnboardingStepCreateSquad } from './onboarding/OnboardingStepCreateSquad'
import { OnboardingStepJoinSquad } from './onboarding/OnboardingStepJoinSquad'
import { OnboardingStepPermissions } from './onboarding/OnboardingStepPermissions'
import { OnboardingStepProfile } from './onboarding/OnboardingStepProfile'
import { OnboardingStepComplete } from './onboarding/OnboardingStepComplete'
import { OnboardingProgress } from './onboarding/OnboardingProgress'

type OnboardingStep =
  | 'splash'
  | 'squad-choice'
  | 'create-squad'
  | 'join-squad'
  | 'permissions'
  | 'profile'
  | 'complete'

export function Onboarding() {
  const { user, profile, refreshProfile } = useAuthStore()
  const { createSquad, joinSquad, fetchSquads, squads } = useSquadsStore()
  const navigate = useNavigate()

  // If the user already has squads (e.g. navigated here by mistake), redirect.
  // The server loader also checks this, but this handles client-side state updates.
  useEffect(() => {
    if (squads.length > 0) {
      navigate('/home', { replace: true })
    }
  }, [squads, navigate])

  const [step, setStep] = useState<OnboardingStep>('squad-choice')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isNavigating, setIsNavigating] = useState(false)
  const [squadName, setSquadName] = useState('')
  const [squadGame, setSquadGame] = useState('')
  const [inviteCode, setInviteCode] = useState('')

  const navigateToStep = useCallback(
    (newStep: OnboardingStep) => {
      if (isNavigating) return
      setIsNavigating(true)
      setError(null)
      if (newStep === 'create-squad') {
        setSquadName('')
        setSquadGame('')
      } else if (newStep === 'join-squad') {
        setInviteCode('')
      }
      setStep(newStep)
      setTimeout(() => setIsNavigating(false), 400)
    },
    [isNavigating]
  )

  const [username, setUsername] = useState('')
  const [timezone, setTimezone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [notifPermission, setNotifPermission] = useState<'granted' | 'denied' | 'default'>(
    'default'
  )
  const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt')
  const [notifRequested, setNotifRequested] = useState(false)
  const [createdSquadId, setCreatedSquadId] = useState<string | null>(null)
  const [createdSquadName, setCreatedSquadName] = useState<string | null>(null)
  const [createdSquadCode, setCreatedSquadCode] = useState<string | null>(null)
  const [showMiniConfetti, setShowMiniConfetti] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  useEffect(() => {
    if ('Notification' in window) {
      setNotifPermission(Notification.permission)
      if (Notification.permission !== 'default') setNotifRequested(true)
    }
  }, [])

  useEffect(() => {
    if (profile?.username) setUsername(profile.username)
    if (profile?.avatar_url) setAvatarUrl(profile.avatar_url)
  }, [profile])

  useEffect(() => {
    if (step === 'complete') {
      setShowMiniConfetti(true)
      setToastMessage(createdSquadId ? '🎉 Squad créée !' : '🎉 Bienvenue !')
      setShowToast(true)
      setTimeout(() => setShowMiniConfetti(false), 3000)
    }
  }, [step, createdSquadId])

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

  const pendingUploadRef = useRef<Promise<void> | null>(null)

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    if (file.size > 5 * 1024 * 1024) {
      setError('Image trop lourde (max 5MB)')
      return
    }
    const localPreviewUrl = URL.createObjectURL(file)
    setAvatarUrl(localPreviewUrl)
    setUploadingAvatar(true)
    setError(null)
    const uploadPromise = (async () => {
      try {
        const compressedBlob = await compressImage(file)
        const fileName = `${user.id}-${Date.now()}.jpg`
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, compressedBlob, { upsert: true, contentType: 'image/jpeg' })
        if (uploadError) throw uploadError
        const {
          data: { publicUrl },
        } = supabase.storage.from('avatars').getPublicUrl(fileName)
        setAvatarUrl(publicUrl)
        await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
          .eq('id', user.id)
        await refreshProfile()
        URL.revokeObjectURL(localPreviewUrl)
      } catch (err) {
        console.error('Avatar upload error:', err)
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
        game: squadGame.trim() || 'Non défini',
      })
      setIsLoading(false)
      if (error) {
        setError(error.message)
      } else if (squad) {
        setCreatedSquadId(squad.id)
        setCreatedSquadName(squad.name)
        setCreatedSquadCode(squad.invite_code)
        setStep('profile')
      } else {
        setError('Erreur lors de la création')
      }
    } catch {
      setIsLoading(false)
      setError('Erreur inattendue')
    }
  }

  const handleJoinSquad = async () => {
    if (!inviteCode.trim()) {
      setError("Le code d'invitation est requis")
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
      setStep('profile')
    }
  }

  const requestNotificationPermission = () => {
    if ('Notification' in window) {
      Notification.requestPermission()
        .then((permission) => {
          setNotifPermission(permission)
          setNotifRequested(true)
        })
        .catch(() => {
          setNotifRequested(true)
        })
    }
  }

  const requestMicPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((track) => track.stop())
      setMicPermission('granted')
    } catch {
      setMicPermission('denied')
    }
  }

  const canProceedFromPermissions = () => notifRequested || Notification.permission === 'granted'

  const saveProfile = async () => {
    if (!user) return
    setIsLoading(true)
    setError(null)
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          username: username.trim() || profile?.username || 'User',
          timezone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
      if (updateError) {
        setError('Erreur lors de la sauvegarde du profil')
        setIsLoading(false)
        return
      }
      refreshProfile().catch(() => {})
      setIsLoading(false)
      setStep('permissions')
    } catch {
      setIsLoading(false)
      setError('Erreur inattendue')
    }
  }

  const handleComplete = async () => {
    if (createdSquadId) {
      navigate(`/squad/${createdSquadId}`, { replace: true })
      return
    }
    await fetchSquads(true)
    const freshSquads = useSquadsStore.getState().squads
    if (freshSquads.length > 0) {
      navigate(`/squad/${freshSquads[0].id}`, { replace: true })
    } else {
      navigate('/squads', { replace: true })
    }
  }

  const goBack = useCallback(() => {
    if (isNavigating) return
    switch (step) {
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
    }
  }, [step, isNavigating, navigateToStep])

  const slideVariants = {
    enter: { opacity: 0, x: 10 },
    center: { opacity: 1, x: 0, transition: { duration: 0.2 } },
    exit: { opacity: 0, x: -10, transition: { duration: 0.15 } },
  }

  return (
    <main
      className="h-[100dvh] bg-bg-base flex items-center justify-center p-4 overflow-y-auto overflow-x-hidden scrollbar-hide-mobile"
      aria-label="Onboarding"
    >
      {showMiniConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={60}
          gravity={0.3}
          colors={[
            'var(--color-primary)',
            'var(--color-success)',
            'var(--color-warning)',
            'var(--color-purple)',
          ]}
          style={{ position: 'fixed', top: 0, left: 0, zIndex: 100, pointerEvents: 'none' }}
        />
      )}
      <StepToast message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />
      <div className="w-full max-w-lg">
        <AnimatePresence mode="wait" initial={false}>
          {step === 'splash' && (
            <OnboardingStepSplash
              slideVariants={slideVariants}
              isNavigating={isNavigating}
              onStart={() => navigateToStep('squad-choice')}
              onSkip={() => {
                localStorage.setItem('sq-onboarding-skipped', 'true')
                window.location.href = '/home'
              }}
            />
          )}
          {step === 'squad-choice' && (
            <OnboardingStepSquadChoice
              slideVariants={slideVariants}
              isNavigating={isNavigating}
              onCreateSquad={() => navigateToStep('create-squad')}
              onJoinSquad={() => navigateToStep('join-squad')}
            />
          )}
          {step === 'create-squad' && (
            <OnboardingStepCreateSquad
              slideVariants={slideVariants}
              squadName={squadName}
              squadGame={squadGame}
              error={error}
              isLoading={isLoading}
              onSquadNameChange={setSquadName}
              onSquadGameChange={setSquadGame}
              onCreateSquad={handleCreateSquad}
              onBack={goBack}
            />
          )}
          {step === 'join-squad' && (
            <OnboardingStepJoinSquad
              slideVariants={slideVariants}
              inviteCode={inviteCode}
              error={error}
              isLoading={isLoading}
              onInviteCodeChange={setInviteCode}
              onJoinSquad={handleJoinSquad}
              onBack={goBack}
            />
          )}
          {step === 'permissions' && (
            <OnboardingStepPermissions
              slideVariants={slideVariants}
              notifPermission={notifPermission}
              micPermission={micPermission}
              isNavigating={isNavigating}
              onRequestNotifications={requestNotificationPermission}
              onRequestMic={requestMicPermission}
              onSkipMic={() => setMicPermission('denied')}
              canProceed={canProceedFromPermissions()}
              onComplete={() => navigateToStep('complete')}
              onBack={goBack}
            />
          )}
          {step === 'profile' && (
            <OnboardingStepProfile
              slideVariants={slideVariants}
              username={username}
              timezone={timezone}
              avatarUrl={avatarUrl}
              uploadingAvatar={uploadingAvatar}
              isLoading={isLoading}
              onUsernameChange={setUsername}
              onTimezoneChange={setTimezone}
              onAvatarUpload={handleAvatarUpload}
              onSave={saveProfile}
              onBack={goBack}
            />
          )}
          {step === 'complete' && (
            <OnboardingStepComplete
              createdSquadId={createdSquadId}
              createdSquadName={createdSquadName}
              createdSquadCode={createdSquadCode}
              squadGame={squadGame}
              squadsLength={squads.length}
              firstSquadName={squads[0]?.name}
              onComplete={handleComplete}
            />
          )}
        </AnimatePresence>
        <OnboardingProgress step={step} />
      </div>
    </main>
  )
}

export default Onboarding
