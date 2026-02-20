
import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { m } from 'framer-motion'
import { Loader2 } from '../components/icons'
import Confetti from '../components/LazyConfetti'
import { PullToRefresh } from '../components/PullToRefresh'
import { useAuthStore, usePremiumStore } from '../hooks'
import { useVoiceChatStore, getSavedPartyInfo } from '../hooks/useVoiceChat'
import { useSquadsQuery } from '../hooks/queries/useSquadsQuery'
import { useActiveSquadParties } from '../hooks/useActiveSquadParties'
import { queryClient } from '../lib/queryClient'
import { supabaseMinimal as supabase } from '../lib/supabaseMinimal'
import { QualityChangeToast } from '../components/NetworkQualityIndicator'
import { ActivePartySection } from './party/PartyActiveSection'
import { PartySquadCard } from './party/PartySquadCard'
import { PartyToast } from './party/PartyToast'
import { PartyEmptyState } from './party/PartyEmptyState'
import { PartySingleSquad, PartyStatsCard } from './party/PartySingleSquad'

export function Party() {
  const { user, profile } = useAuthStore()
  const { hasPremium } = usePremiumStore()
  const { data: squads = [], isLoading: squadsLoadingRaw, isPending: squadsLoadingPending } = useSquadsQuery()
  const squadsLoading = squadsLoadingRaw || squadsLoadingPending
  const squadIds = useMemo(() => squads.map((s) => s.id), [squads])
  const { parties: activeParties } = useActiveSquadParties(squadIds)
  const {
    isConnected,
    isConnecting,
    isReconnecting,
    currentChannel,
    joinChannel,
    leaveChannel,
    remoteUsers,
  } = useVoiceChatStore()
  // These properties may not exist on VoiceChatState yet — cast to access safely
  const networkQualityChanged = (useVoiceChatStore.getState() as any).networkQualityChanged
  const clearNetworkQualityNotification = (useVoiceChatStore.getState() as any).clearNetworkQualityNotification

  const [toastMessage, setToastMessage] = useState('')
  const [showToast, setShowToast] = useState(false)
  const [toastVariant, setToastVariant] = useState<'success' | 'error' | 'warning'>('success')
  const wasReconnecting = useRef(false)
  const [showDuoConfetti, setShowDuoConfetti] = useState(false)
  const hadDuoCelebration = useRef(false)
  const prevRemoteCount = useRef(0)
  const hasAttemptedAutoReconnect = useRef(false)
  const [showQualityToast, setShowQualityToast] = useState(false)
  const [qualityToastLevel, setQualityToastLevel] = useState<
    'excellent' | 'good' | 'medium' | 'poor'
  >('good')

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['squads'] })
  }, [])

  // Squads loaded via React Query (cache seeded by SSR loader)

  useEffect(() => {
    if (hasAttemptedAutoReconnect.current || isConnected || isConnecting) return
    if (!user || !profile) return
    const savedParty = getSavedPartyInfo()
    if (savedParty) {
      hasAttemptedAutoReconnect.current = true
      setTimeout(() => {
        joinChannel(savedParty.channelName, savedParty.userId, savedParty.username, hasPremium)
          .then((success) => {
            if (success) {
              setToastMessage('Reconnecté à la party !')
              setToastVariant('success')
              setShowToast(true)
            }
          })
          .catch((err) => console.error('[Party] Auto-reconnect failed:', err))
      }, 500)
    }
  }, [user, profile, isConnected, isConnecting, joinChannel])

  useEffect(() => {
    if (wasReconnecting.current && !isReconnecting && isConnected) {
      queueMicrotask(() => {
        setToastMessage('Connexion rétablie !')
        setToastVariant('success')
        setShowToast(true)
      })
    }
    wasReconnecting.current = isReconnecting
  }, [isReconnecting, isConnected])

  useEffect(() => {
    if (networkQualityChanged && networkQualityChanged !== 'unknown') {
      queueMicrotask(() => {
        setQualityToastLevel(networkQualityChanged as 'excellent' | 'good' | 'medium' | 'poor')
        setShowQualityToast(true)
        clearNetworkQualityNotification()
      })
    }
  }, [networkQualityChanged, clearNetworkQualityNotification])

  useEffect(() => {
    const currentRemoteCount = remoteUsers.length
    if (
      isConnected &&
      currentRemoteCount > 0 &&
      prevRemoteCount.current === 0 &&
      !hadDuoCelebration.current
    ) {
      hadDuoCelebration.current = true
      queueMicrotask(() => {
        setShowDuoConfetti(true)
        setToastMessage('🎉 Vous êtes 2 ! La party commence')
        setToastVariant('success')
        setShowToast(true)
        setTimeout(() => setShowDuoConfetti(false), 4000)
      })
    }
    if (!isConnected) hadDuoCelebration.current = false
    prevRemoteCount.current = currentRemoteCount
  }, [remoteUsers.length, isConnected])

  const handleJoinParty = async (squadId: string) => {
    if (!user || !profile) return
    const channelName = `squad-${squadId}`
    const squad = squads.find((s) => s.id === squadId)
    try {
      const success = await joinChannel(
        channelName,
        user.id,
        profile.username || 'Joueur',
        hasPremium
      )
      if (success) {
        setToastMessage(`Tu as rejoint la party ${squad?.name || ''}`)
        setToastVariant('success')
        setShowToast(true)

        // Notify squad members that a party was started/joined
        notifySquadMembersPartyStarted(squadId, squad?.name || 'Squad', user.id, profile.username || 'Joueur')
      } else {
        setToastMessage('Impossible de rejoindre la party')
        setToastVariant('error')
        setShowToast(true)
      }
    } catch {
      setToastMessage('Erreur de connexion à la party')
      setToastVariant('error')
      setShowToast(true)
    }
  }

  const handleLeaveParty = async () => {
    try {
      await leaveChannel()
    } catch (err) {
      console.error('[Party] Error leaving:', err)
    }
  }

  // Notify all squad members (except self) when a party starts
  const notifySquadMembersPartyStarted = async (
    squadId: string,
    squadName: string,
    userId: string,
    username: string,
  ) => {
    try {
      const { data: members } = await supabase
        .from('squad_members')
        .select('user_id')
        .eq('squad_id', squadId)
        .neq('user_id', userId)
      if (!members?.length) return

      const memberIds = members.map((m) => m.user_id)

      // Insert in-app notifications for each member
      const notifications = memberIds.map((memberId) => ({
        user_id: memberId,
        type: 'party_started',
        title: 'Party lancée !',
        message: `${username} a lancé une party dans ${squadName}`,
        data: { squad_id: squadId, party_link: `${window.location.origin}/party`, started_by: userId },
      }))
      await supabase.from('notifications').insert(notifications)

      // Send push notifications
      await supabase.functions.invoke('send-push', {
        body: {
          userIds: memberIds,
          title: 'Party lancée !',
          body: `${username} a lancé une party dans ${squadName}`,
          icon: '/icon-192.svg',
          tag: `party-started-${squadId}`,
          url: '/party',
          data: { type: 'party_started', squad_id: squadId },
          vibrate: [200, 100, 200],
        },
      }).catch((err) => console.warn('[Party] Push notify failed:', err))
    } catch (err) {
      console.warn('[Party] Failed to notify squad members:', err)
    }
  }

  const activeSquadId = currentChannel?.replace('squad-', '') || null
  const activeSquad = squads.find((s) => s.id === activeSquadId)
  const otherSquads = squads.filter((s) => s.id !== activeSquadId)

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <main className="min-h-0 bg-bg-base pb-6 page-enter" aria-label="Party vocale">
      {showDuoConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={120}
          gravity={0.25}
          colors={[
            'var(--color-primary)',
            'var(--color-success)',
            'var(--color-warning)',
            'var(--color-purple)',
            'var(--color-text-primary)',
          ]}
          style={{ position: 'fixed', top: 0, left: 0, zIndex: 100, pointerEvents: 'none' }}
        />
      )}
      <PartyToast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
        variant={toastVariant}
      />
      <QualityChangeToast
        isVisible={showQualityToast}
        newQuality={qualityToastLevel}
        onClose={() => setShowQualityToast(false)}
      />

      <div className="px-4 md:px-6 py-6 max-w-4xl lg:max-w-5xl mx-auto">
        <div>
          <header className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-lg font-bold text-text-primary">Party</h1>
              <p className="text-base text-text-tertiary">
                {isConnected
                  ? 'Connecté'
                  : squads.length > 0
                    ? `${squads.length} squad${squads.length > 1 ? 's' : ''}`
                    : 'Rejoins une squad'}
              </p>
            </div>
            {isConnected && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/15 border border-success/30">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="text-sm font-medium text-success">En ligne</span>
              </div>
            )}
          </header>

          {squadsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : squads.length === 0 ? (
            <PartyEmptyState />
          ) : (
            <>
              {isConnected && activeSquad && user && (
                <div className="mb-6">
                  <ActivePartySection
                    squad={{
                      id: activeSquad.id,
                      name: activeSquad.name,
                      game: activeSquad.game || 'Jeu',
                    }}
                    onLeave={handleLeaveParty}
                    currentUserId={user.id}
                  />
                </div>
              )}

              {!isConnected && (
                <m.div
                  className="space-y-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  {squads.length === 1 ? (
                    <PartySingleSquad
                      squad={{ ...squads[0], game: squads[0].game || 'Jeu' }}
                      isConnecting={isConnecting}
                      onJoin={() => handleJoinParty(squads[0].id)}
                    />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div className="md:col-span-3 space-y-3">
                        <p className="text-sm font-medium text-text-secondary mb-1">
                          Choisis une squad pour lancer la party
                        </p>
                        {squads.map((squad) => (
                          <PartySquadCard
                            key={squad.id}
                            squad={{
                              id: squad.id,
                              name: squad.name,
                              game: squad.game || 'Jeu',
                              member_count: squad.member_count ?? 0,
                            }}
                            onJoin={() => handleJoinParty(squad.id)}
                            isConnecting={isConnecting}
                            activeParty={activeParties.get(squad.id)}
                          />
                        ))}
                      </div>
                      <div className="md:col-span-2 hidden md:flex flex-col gap-3">
                        <PartyStatsCard squadName={squads[0]?.name || 'Squad'} />
                      </div>
                    </div>
                  )}
                </m.div>
              )}

              {isConnected && otherSquads.length > 0 && (
                <div>
                  <h2 className="text-base font-semibold text-text-primary mb-3">Autres squads</h2>
                  <div className="space-y-3">
                    {otherSquads.map((squad) => (
                      <PartySquadCard
                        key={squad.id}
                        squad={{
                          id: squad.id,
                          name: squad.name,
                          game: squad.game || 'Jeu',
                          member_count: squad.member_count ?? 0,
                        }}
                        onJoin={() => handleJoinParty(squad.id)}
                        isConnecting={isConnecting}
                        activeParty={activeParties.get(squad.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
    </PullToRefresh>
  )
}

export default Party
