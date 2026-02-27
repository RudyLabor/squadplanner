import { useEffect, useState } from 'react'
import { m } from 'framer-motion'
import { supabaseMinimal as supabase } from '../../lib/supabaseMinimal'

interface MemberReliability {
  id: string
  username: string
  reliability_score: number
  avatar_url: string | null
}

// Fonction pour obtenir la couleur en fonction du score
const getReliabilityColor = (score: number): { bg: string; bar: string; text: string } => {
  if (score >= 80) {
    return { bg: 'bg-emerald-50', bar: 'bg-emerald-500', text: 'text-emerald-700' }
  }
  if (score >= 50) {
    return { bg: 'bg-amber-50', bar: 'bg-amber-500', text: 'text-amber-700' }
  }
  return { bg: 'bg-red-50', bar: 'bg-red-500', text: 'text-red-700' }
}

export default function MemberReliabilityChart({ squadId }: { squadId: string }) {
  const [members, setMembers] = useState<MemberReliability[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMemberReliability = async () => {
      try {
        setLoading(true)

        const { data: squadMembers, error: membersError } = await supabase
          .from('squad_members')
          .select('*, profiles(username, avatar_url, reliability_score)')
          .eq('squad_id', squadId)
          .order('profiles.reliability_score', { ascending: false })

        if (membersError) {
          console.error('Erreur récupération membres:', membersError)
          setLoading(false)
          return
        }

        const membersList =
          squadMembers
            ?.map((member) => ({
              id: member.user_id,
              username: member.profiles?.username || 'Unknown',
              reliability_score: member.profiles?.reliability_score || 0,
              avatar_url: member.profiles?.avatar_url || null,
            }))
            .sort((a, b) => b.reliability_score - a.reliability_score) || []

        setMembers(membersList)
      } catch (err) {
        console.error('Erreur chart:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchMemberReliability()
  }, [squadId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (members.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-text-tertiary">
        <p>Aucun membre trouvé</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {members.map((member, idx) => {
        const colors = getReliabilityColor(member.reliability_score)
        return (
          <m.div
            key={member.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`p-3 rounded-lg ${colors.bg} border border-border-subtle`}
          >
            <div className="space-y-2">
              {/* En-tête avec nom */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {member.avatar_url && (
                    <img
                      src={member.avatar_url}
                      alt={member.username}
                      className="w-6 h-6 rounded-full"
                    />
                  )}
                  <span className="text-sm font-medium text-text-primary">{member.username}</span>
                </div>
                <span className={`text-sm font-bold ${colors.text}`}>
                  {member.reliability_score}%
                </span>
              </div>

              {/* Barre de progression */}
              <div className="w-full h-2 bg-surface-card rounded-full overflow-hidden border border-border-subtle">
                <m.div
                  initial={{ width: 0 }}
                  animate={{ width: `${member.reliability_score}%` }}
                  transition={{ delay: idx * 0.05 + 0.1, duration: 0.6 }}
                  className={`h-full ${colors.bar}`}
                />
              </div>

              {/* Label de fiabilité */}
              <div className="text-xs text-text-tertiary">
                {member.reliability_score >= 80
                  ? 'Très fiable'
                  : member.reliability_score >= 50
                    ? 'Fiable'
                    : 'À améliorer'}
              </div>
            </div>
          </m.div>
        )
      })}

      {/* Statistiques globales */}
      <div className="mt-6 pt-4 border-t border-border-subtle">
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-surface-card rounded-lg p-3 text-center border border-border-subtle">
            <div className="text-xs text-text-tertiary mb-1">Moyenne</div>
            <div className="text-lg font-bold text-text-primary">
              {Math.round(
                members.reduce((sum, m) => sum + m.reliability_score, 0) / members.length
              )}
              %
            </div>
          </div>
          <div className="bg-surface-card rounded-lg p-3 text-center border border-border-subtle">
            <div className="text-xs text-text-tertiary mb-1">Meilleur</div>
            <div className="text-lg font-bold text-emerald-600">
              {Math.max(...members.map((m) => m.reliability_score))}%
            </div>
          </div>
          <div className="bg-surface-card rounded-lg p-3 text-center border border-border-subtle">
            <div className="text-xs text-text-tertiary mb-1">Membres</div>
            <div className="text-lg font-bold text-text-primary">{members.length}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
