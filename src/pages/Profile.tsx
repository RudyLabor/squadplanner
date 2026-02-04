import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  User, Trophy, Calendar, Target, Shield,
  Settings, LogOut, Edit2, Check, X, Sparkles, Zap, Camera, Loader2
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, CardContent, Input } from '../components/ui'
import { useAuthStore } from '../hooks'
import { theme } from '../lib/theme'
import { supabase } from '../lib/supabase'

const containerVariants = theme.animation.container
const itemVariants = theme.animation.item

export function Profile() {
  const navigate = useNavigate()
  const { user, profile, signOut, updateProfile, isLoading } = useAuthStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isEditing, setIsEditing] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')

  // Sync state with profile when it changes
  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '')
      setBio(profile.bio || '')
    }
  }, [profile])

  const handleSave = async () => {
    const result = await updateProfile({ username, bio })
    if (!result.error) {
      setIsEditing(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setIsUploadingPhoto(true)
    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Update profile with new avatar URL
      await updateProfile({ avatar_url: publicUrl })
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

  return (
    <div className="min-h-screen bg-[#08090a] pb-8">
      <div className="px-4 md:px-6 py-6 max-w-2xl mx-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="mb-8">
            <h1 className="text-2xl font-bold text-[#f7f8f8] mb-2">Mon Profil</h1>
            <p className="text-[14px] text-[#8b8d90]">
              Ton identité et tes statistiques de fiabilité
            </p>
          </motion.div>

          {/* Profile Card */}
          <motion.div variants={itemVariants} className="mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Avatar with upload */}
                  <div className="relative">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#5e6dd2] to-[#8b93ff] flex items-center justify-center overflow-hidden">
                      {profile?.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-10 h-10 text-white" strokeWidth={1.5} />
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
                      className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#5e6dd2] flex items-center justify-center border-2 border-[#08090a] hover:bg-[#4a59c2] transition-colors"
                    >
                      {isUploadingPhoto ? (
                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                      ) : (
                        <Camera className="w-4 h-4 text-white" />
                      )}
                    </button>
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1">
                    {isEditing ? (
                      <div className="space-y-3">
                        <Input
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="Ton pseudo"
                        />
                        <Input
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          placeholder="Bio (optionnel)"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleSave} disabled={isLoading}>
                            <Check className="w-4 h-4" />
                            Sauvegarder
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 mb-1">
                          <h2 className="text-xl font-bold text-[#f7f8f8]">
                            {profile?.username || 'Gamer'}
                          </h2>
                          <button 
                            onClick={() => setIsEditing(true)}
                            className="p-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.05)]"
                          >
                            <Edit2 className="w-4 h-4 text-[#5e6063]" />
                          </button>
                        </div>
                        <p className="text-[14px] text-[#8b8d90] mb-2">
                          {profile?.bio || 'Aucune bio'}
                        </p>
                        <p className="text-[12px] text-[#5e6063]">
                          {user?.email}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Reliability Score - Key metric */}
          <motion.div variants={itemVariants} className="mb-6">
            <Card className="overflow-hidden">
              <div 
                className="h-1"
                style={{ 
                  background: `linear-gradient(to right, ${reliabilityColor} ${reliabilityScore}%, transparent ${reliabilityScore}%)` 
                }}
              />
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: `${reliabilityColor}15` }}
                  >
                    <Shield className="w-8 h-8" style={{ color: reliabilityColor }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-3xl font-bold text-[#f7f8f8]">{reliabilityScore}%</span>
                      <span className="text-[14px] text-[#8b8d90]">Score de fiabilité</span>
                    </div>
                    <p className="text-[13px] text-[#5e6063]">
                      Basé sur tes check-ins, réponses et présences réelles
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Stats Grid */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3 mb-6">
            {[
              { icon: Calendar, label: 'Sessions jouées', value: profile?.total_sessions || 0, color: '#f5a623' },
              { icon: Check, label: 'Check-ins', value: profile?.total_checkins || 0, color: '#4ade80' },
              { icon: Target, label: 'Niveau', value: profile?.level || 1, color: '#5e6dd2' },
              { icon: Trophy, label: 'XP', value: profile?.xp || 0, color: '#8b93ff' },
            ].map(stat => (
              <Card key={stat.label} className="p-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${stat.color}15` }}
                  >
                    <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                  </div>
                  <div>
                    <div className="text-[18px] font-bold text-[#f7f8f8]">{stat.value}</div>
                    <div className="text-[12px] text-[#5e6063]">{stat.label}</div>
                  </div>
                </div>
              </Card>
            ))}
          </motion.div>

          {/* IA Coach insight */}
          <motion.div variants={itemVariants} className="mb-6">
            <Card className="p-4 border-[rgba(139,147,255,0.2)] bg-[rgba(139,147,255,0.05)]">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[rgba(139,147,255,0.15)] flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-[#8b93ff]" />
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold text-[#f7f8f8] mb-1">
                    💡 Conseil IA
                  </h3>
                  <p className="text-[13px] text-[#8b8d90]">
                    Tu réponds plus vite que 70% des joueurs ! Continue comme ça, 
                    <span className="text-[#4ade80]"> ta fiabilité est excellente</span>.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Premium upsell */}
          {!(profile as { is_premium?: boolean } | null)?.is_premium && (
            <motion.div variants={itemVariants} className="mb-6">
              <Card className="p-6 bg-gradient-to-br from-[rgba(94,109,210,0.1)] to-[rgba(245,166,35,0.05)] border-[rgba(94,109,210,0.2)]">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-5 h-5 text-[#f5a623]" />
                  <h3 className="text-[16px] font-semibold text-[#f7f8f8]">Passe en Premium</h3>
                </div>
                <ul className="space-y-2 mb-4">
                  {[
                    'IA avancée pour optimiser tes sessions',
                    'Statistiques complètes et historique illimité',
                    'Badges exclusifs et personnalisation',
                  ].map(feature => (
                    <li key={feature} className="flex items-center gap-2 text-[13px] text-[#8b8d90]">
                      <Check className="w-4 h-4 text-[#4ade80]" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button>
                  <Zap className="w-4 h-4" />
                  Découvrir Premium
                </Button>
              </Card>
            </motion.div>
          )}

          {/* Actions */}
          <motion.div variants={itemVariants} className="space-y-3">
            <Button variant="secondary" className="w-full">
              <Settings className="w-4 h-4" />
              Paramètres
            </Button>
            <Button variant="ghost" className="w-full text-[#f87171]" onClick={handleSignOut}>
              <LogOut className="w-4 h-4" />
              Déconnexion
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
