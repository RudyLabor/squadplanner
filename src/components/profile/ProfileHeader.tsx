import { useState, useEffect, useRef } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { User, Edit2, Check, X, Camera, Loader2 } from '../icons'
import { useNavigate } from 'react-router'
import { showSuccess, showError } from '../../lib/toast'
import { Button, Input, Expandable } from '../ui'
import { supabaseMinimal as supabase } from '../../lib/supabaseMinimal'

interface ProfileHeaderProps {
  user: { id: string; email?: string } | null
  profile: {
    username?: string
    bio?: string | null
    avatar_url?: string | null
  } | null
  isLoading: boolean
  updateProfile: (data: Record<string, unknown>) => Promise<{ error?: unknown }>
}

export function ProfileHeader({ user, profile, isLoading, updateProfile }: ProfileHeaderProps) {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isEditing, setIsEditing] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '')
      setBio(profile.bio || '')
    }
  }, [profile])

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
          (blob) => (blob ? resolve(blob) : reject(new Error('Compression failed'))),
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

      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(fileName)
      await updateProfile({ avatar_url: publicUrl })
      setLocalPreviewUrl(null)
      URL.revokeObjectURL(previewUrl)
    } catch (error) {
      console.error('Error uploading photo:', error)
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  const handleSave = async () => {
    const result = await updateProfile({ username, bio })
    if (!result.error) {
      setIsEditing(false)
      showSuccess('Profil mis à jour')
    } else {
      showError('Erreur lors de la mise à jour')
    }
  }

  return (
    <div className="relative">
      <div className="absolute inset-0 h-48 bg-gradient-to-b from-primary-15 to-transparent" />

      <div className="relative px-4 md:px-6 lg:px-8 pt-8 pb-4 max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto">
        <div className="flex flex-col items-center mb-6">
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-purple flex items-center justify-center overflow-hidden ring-4 ring-bg-base">
              {localPreviewUrl || profile?.avatar_url ? (
                <img
                  src={localPreviewUrl || profile?.avatar_url || undefined}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
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
              className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full bg-primary-bg flex items-center justify-center border-3 border-bg-base hover:bg-primary-bg transition-colors shadow-md"
            >
              {isUploadingPhoto ? (
                <Loader2 className="w-4 h-4 text-white animate-spin" aria-hidden="true" />
              ) : (
                <Camera className="w-4 h-4 text-white" aria-hidden="true" />
              )}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {isEditing ? (
              <m.div
                key="editing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-[340px] p-5 rounded-2xl bg-bg-elevated border border-border-default shadow-xl space-y-4"
              >
                <h3 className="text-md font-semibold text-text-primary text-center">
                  Modifier le profil
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-text-tertiary mb-1">Pseudo</label>
                    <Input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Ton pseudo"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-text-tertiary mb-1">Bio</label>
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
              </m.div>
            ) : (
              <m.div
                key="display"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center"
              >
                <h1 className="text-xl font-bold text-text-primary mb-1">
                  {profile?.username || 'Gamer'}
                </h1>
                <Expandable previewLines={2} className="text-md text-text-tertiary mb-1 max-w-sm">
                  {profile?.bio || 'Pas encore de bio'}
                </Expandable>
                <p className="text-sm text-text-quaternary mb-3">{user?.email}</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/12 text-primary-hover text-base font-medium hover:bg-primary/20 transition-colors active:scale-[0.97]"
                  >
                    <Edit2 className="w-4 h-4" />
                    Modifier le profil
                  </button>
                  <button
                    onClick={() => navigate('/settings')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-card text-text-tertiary text-base font-medium hover:bg-surface-card-hover hover:text-text-primary transition-colors active:scale-[0.97]"
                  >
                    Paramètres
                  </button>
                </div>
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
