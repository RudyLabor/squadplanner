import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Plus, ArrowLeft, Gamepad2, Link as LinkIcon, Copy, Check, Loader2, UserPlus } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Card, CardContent, Input } from '../components/ui'
import { useAuthStore, useSquadsStore } from '../hooks'
import { theme } from '../lib/theme'

const containerVariants = theme.animation.container
const itemVariants = theme.animation.item

export default function Squads() {
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [name, setName] = useState('')
  const [game, setGame] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const { user, isInitialized } = useAuthStore()
  const { squads, isLoading, fetchSquads, createSquad, joinSquad } = useSquadsStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (isInitialized && !user) {
      navigate('/auth')
    } else if (user) {
      fetchSquads()
    }
  }, [user, isInitialized, navigate, fetchSquads])

  const handleCreateSquad = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!name.trim() || !game.trim()) {
      setError('Nom et jeu sont requis')
      return
    }

    const { error } = await createSquad({ name, game })
    if (error) {
      setError(error.message)
    } else {
      setShowCreate(false)
      setName('')
      setGame('')
    }
  }

  const handleJoinSquad = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!inviteCode.trim()) {
      setError('Code d\'invitation requis')
      return
    }

    const { error } = await joinSquad(inviteCode)
    if (error) {
      setError(error.message)
    } else {
      setShowJoin(false)
      setInviteCode('')
    }
  }

  const copyInviteCode = async (code: string) => {
    await navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-[#08090a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#5e6dd2] animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#08090a] pb-8">
      <div className="px-4 md:px-6 py-6 max-w-2xl mx-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link to="/" className="p-2 rounded-lg hover:bg-[rgba(255,255,255,0.05)] transition-colors">
                <ArrowLeft className="w-5 h-5 text-[#8b8d90]" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-[#f7f8f8]">Mes Squads</h1>
                <p className="text-[13px] text-[#5e6063]">{squads.length} squad{squads.length > 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setShowJoin(true)}>
                <UserPlus className="w-4 h-4" />
                Rejoindre
              </Button>
              <Button size="sm" onClick={() => setShowCreate(true)}>
                <Plus className="w-4 h-4" />
                Créer
              </Button>
            </div>
          </motion.div>

          {/* Join Form */}
          {showJoin && (
            <motion.div variants={itemVariants} className="mb-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-[#f7f8f8] mb-4">Rejoindre une squad</h3>
                  <form onSubmit={handleJoinSquad} className="space-y-4">
                    <Input
                      label="Code d'invitation"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      placeholder="ABC123"
                      icon={<LinkIcon className="w-5 h-5" />}
                    />
                    {error && (
                      <div className="p-3 rounded-lg bg-[rgba(248,113,113,0.1)] border border-[rgba(248,113,113,0.2)]">
                        <p className="text-[#f87171] text-sm">{error}</p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button type="button" variant="ghost" onClick={() => { setShowJoin(false); setError(null) }}>
                        Annuler
                      </Button>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Rejoindre'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Create Form */}
          {showCreate && (
            <motion.div variants={itemVariants} className="mb-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-[#f7f8f8] mb-4">Créer une squad</h3>
                  <form onSubmit={handleCreateSquad} className="space-y-4">
                    <Input
                      label="Nom de la squad"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Les Légendes"
                      icon={<Users className="w-5 h-5" />}
                    />
                    <Input
                      label="Jeu principal"
                      value={game}
                      onChange={(e) => setGame(e.target.value)}
                      placeholder="Valorant, LoL..."
                      icon={<Gamepad2 className="w-5 h-5" />}
                    />
                    {error && (
                      <div className="p-3 rounded-lg bg-[rgba(248,113,113,0.1)] border border-[rgba(248,113,113,0.2)]">
                        <p className="text-[#f87171] text-sm">{error}</p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button type="button" variant="ghost" onClick={() => { setShowCreate(false); setError(null) }}>
                        Annuler
                      </Button>
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Créer la squad'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Squads List */}
          {squads.length > 0 ? (
            <motion.div variants={itemVariants} className="space-y-3">
              {squads.map((squad) => (
                <motion.div
                  key={squad.id}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link to={`/squad/${squad.id}`}>
                    <Card className="cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-[rgba(94,109,210,0.15)] flex items-center justify-center">
                            <Gamepad2 className="w-6 h-6 text-[#5e6dd2]" strokeWidth={1.5} />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-[16px] font-semibold text-[#f7f8f8]">{squad.name}</h3>
                            <p className="text-[13px] text-[#8b8d90]">{squad.game} • {squad.member_count} membre{(squad.member_count || 0) > 1 ? 's' : ''}</p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              copyInviteCode(squad.invite_code)
                            }}
                            className="p-2 rounded-lg hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                            title="Copier le code d'invitation"
                          >
                            {copiedCode === squad.invite_code ? (
                              <Check className="w-4 h-4 text-[#4ade80]" />
                            ) : (
                              <Copy className="w-4 h-4 text-[#5e6063]" />
                            )}
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          ) : !showCreate && !showJoin && (
            <motion.div variants={itemVariants}>
              <div className="p-8 md:p-12 rounded-3xl bg-gradient-to-b from-[#18191b] to-[#101012] border border-[rgba(255,255,255,0.06)] text-center">
                <div className="w-16 h-16 rounded-3xl bg-[#1f2023] flex items-center justify-center mx-auto mb-6">
                  <Users className="w-8 h-8 text-[#5e6063]" strokeWidth={1.2} />
                </div>
                <h3 className="text-[18px] font-bold text-[#f7f8f8] mb-2">Aucune squad pour l'instant</h3>
                <p className="text-[14px] text-[#8b8d90] mb-8 max-w-sm mx-auto">
                  Crée ta première squad ou rejoins-en une avec un code d'invitation
                </p>
                <div className="flex gap-3 justify-center">
                  <Button variant="secondary" onClick={() => setShowJoin(true)}>
                    <UserPlus className="w-5 h-5" />
                    Rejoindre
                  </Button>
                  <motion.button
                    className="inline-flex items-center gap-2.5 h-12 px-7 rounded-xl bg-[#5e6dd2] text-white text-[15px] font-semibold shadow-lg shadow-[#5e6dd2]/20"
                    whileHover={{ y: -2, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowCreate(true)}
                  >
                    <Plus className="w-5 h-5" strokeWidth={2} />
                    Créer ma squad
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
