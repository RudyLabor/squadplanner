import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Calendar, TrendingUp, Plus, ChevronRight, LogOut, Loader2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Card, Badge } from '../components/ui'
import { useAuthStore, useSquadsStore } from '../hooks'
import { theme } from '../lib/theme'

const containerVariants = theme.animation.container
const itemVariants = theme.animation.item

// Stats card component
function StatCard({ icon: Icon, value, label, color }: {
  icon: React.ElementType
  value: string | number
  label: string
  color: string
}) {
  return (
    <motion.div variants={itemVariants}>
      <Card className="p-4">
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="w-5 h-5" style={{ color }} strokeWidth={1.5} />
        </div>
        <div className="text-[20px] font-semibold text-[#f7f8f8]">{value}</div>
        <div className="text-[12px] text-[#5e6063]">{label}</div>
      </Card>
    </motion.div>
  )
}

export default function Home() {
  const { user, profile, isInitialized, signOut } = useAuthStore()
  const { squads, fetchSquads } = useSquadsStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      fetchSquads()
    }
  }, [user, fetchSquads])

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
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
            <div>
              <h1 className="text-2xl font-bold text-[#f7f8f8]">Squad Planner</h1>
              <p className="text-[14px] text-[#8b8d90]">
                {user ? `Salut ${profile?.username || 'Gamer'} 👋` : 'Transforme tes intentions en sessions réelles'}
              </p>
            </div>
            {user ? (
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4" />
                Déconnexion
              </Button>
            ) : (
              <Link to="/auth">
                <Button variant="secondary" size="sm">Connexion</Button>
              </Link>
            )}
          </motion.div>

          {/* Stats */}
          <motion.div variants={itemVariants} className="grid grid-cols-3 gap-3 mb-8">
            <StatCard
              icon={Users}
              value={squads.length}
              label="Squads"
              color={theme.colors.primary}
            />
            <StatCard
              icon={Calendar}
              value={0}
              label="Sessions"
              color={theme.colors.warning}
            />
            <StatCard
              icon={TrendingUp}
              value={`${profile?.reliability_score || 100}%`}
              label="Fiabilité"
              color={theme.colors.success}
            />
          </motion.div>

          {/* Quick actions */}
          {user && (
            <motion.div variants={itemVariants} className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[11px] font-medium text-[rgba(255,255,255,0.35)] uppercase tracking-[0.05em]">
                  Actions rapides
                </h2>
              </div>
              <Link to="/squads">
                <motion.div
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <Card className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-[rgba(94,109,210,0.15)] flex items-center justify-center">
                        <Plus className="w-5 h-5 text-[#5e6dd2]" />
                      </div>
                      <div className="flex-1">
                        <div className="text-[15px] font-medium text-[#f7f8f8]">Gérer mes squads</div>
                        <div className="text-[13px] text-[#8b8d90]">Crée, rejoins, organise</div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-[#5e6063]" />
                    </div>
                  </Card>
                </motion.div>
              </Link>
            </motion.div>
          )}

          {/* Recent squads or welcome */}
          {user ? (
            squads.length > 0 ? (
              <motion.div variants={itemVariants}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[11px] font-medium text-[rgba(255,255,255,0.35)] uppercase tracking-[0.05em]">
                    Mes squads
                  </h2>
                  <Link to="/squads">
                    <motion.button
                      className="text-[13px] text-[#5e6dd2] hover:text-[#8b93ff] font-medium flex items-center gap-1"
                      whileHover={{ x: 2 }}
                    >
                      Voir tout
                      <ChevronRight className="w-3.5 h-3.5" />
                    </motion.button>
                  </Link>
                </div>
                <div className="space-y-3">
                  {squads.slice(0, 3).map((squad) => (
                    <Link key={squad.id} to={`/squad/${squad.id}`}>
                      <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.99 }}>
                        <Card className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-[rgba(94,109,210,0.15)] flex items-center justify-center">
                              <Users className="w-5 h-5 text-[#5e6dd2]" />
                            </div>
                            <div className="flex-1">
                              <div className="text-[15px] font-medium text-[#f7f8f8]">{squad.name}</div>
                              <div className="text-[13px] text-[#8b8d90]">{squad.game}</div>
                            </div>
                            <Badge variant="default">{squad.member_count} membres</Badge>
                          </div>
                        </Card>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div variants={itemVariants}>
                <div className="p-8 md:p-12 rounded-3xl bg-gradient-to-b from-[#18191b] to-[#101012] border border-[rgba(255,255,255,0.06)] text-center">
                  <div className="w-16 h-16 rounded-3xl bg-[#1f2023] flex items-center justify-center mx-auto mb-6">
                    <Users className="w-8 h-8 text-[#5e6063]" strokeWidth={1.2} />
                  </div>
                  <h3 className="text-[18px] font-bold text-[#f7f8f8] mb-2">Bienvenue sur Squad Planner</h3>
                  <p className="text-[14px] text-[#8b8d90] mb-8">
                    Crée ta première squad et commence à organiser des sessions de jeu régulières avec tes amis.
                  </p>
                  <Link to="/squads">
                    <motion.button
                      className="inline-flex items-center gap-2.5 h-12 px-7 rounded-xl bg-[#5e6dd2] text-white text-[15px] font-semibold shadow-lg shadow-[#5e6dd2]/20"
                      whileHover={{ y: -2, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Plus className="w-5 h-5" strokeWidth={2} />
                      Créer ma squad
                    </motion.button>
                  </Link>
                </div>
              </motion.div>
            )
          ) : (
            <motion.div variants={itemVariants}>
              <div className="p-8 md:p-12 rounded-3xl bg-gradient-to-b from-[#18191b] to-[#101012] border border-[rgba(255,255,255,0.06)] text-center">
                <div className="w-16 h-16 rounded-3xl bg-[#1f2023] flex items-center justify-center mx-auto mb-6">
                  <Users className="w-8 h-8 text-[#5e6063]" strokeWidth={1.2} />
                </div>
                <h3 className="text-[18px] font-bold text-[#f7f8f8] mb-2">Rejoins l'aventure</h3>
                <p className="text-[14px] text-[#8b8d90] mb-8">
                  Connecte-toi pour créer ta squad et planifier des sessions avec tes amis.
                </p>
                <Link to="/auth">
                  <motion.button
                    className="inline-flex items-center gap-2.5 h-12 px-7 rounded-xl bg-[#5e6dd2] text-white text-[15px] font-semibold shadow-lg shadow-[#5e6dd2]/20"
                    whileHover={{ y: -2, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Commencer
                  </motion.button>
                </Link>
              </div>
            </motion.div>
          )}

          {/* Features section for non-logged users */}
          {!user && (
            <motion.div variants={itemVariants} className="mt-8 space-y-4">
              <h2 className="text-[11px] font-medium text-[rgba(255,255,255,0.35)] uppercase tracking-[0.05em]">
                Comment ça marche
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { step: '1', title: 'Crée ta squad', desc: 'Invite tes amis avec un code' },
                  { step: '2', title: 'Planifie', desc: 'Propose des créneaux de jeu' },
                  { step: '3', title: 'Joue', desc: 'Check-in et fiabilité' },
                ].map((item) => (
                  <Card key={item.step} className="p-4">
                    <div className="w-8 h-8 rounded-lg bg-[rgba(94,109,210,0.15)] flex items-center justify-center mb-3">
                      <span className="text-[#5e6dd2] font-bold">{item.step}</span>
                    </div>
                    <h3 className="text-[15px] font-medium text-[#f7f8f8] mb-1">{item.title}</h3>
                    <p className="text-[13px] text-[#8b8d90]">{item.desc}</p>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
