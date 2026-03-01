import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { Sparkles } from '../components/icons'
import { useMessagesStore } from '../hooks/useMessages'
import { useDirectMessagesStore } from '../hooks/useDirectMessages'
import { useAuthStore } from '../hooks/useAuth'
import { useTypingIndicator } from '../hooks/useTypingIndicator'
import { useStatePersistence } from '../hooks/useStatePersistence'
import { useKeyboardVisible } from '../hooks/useKeyboardVisible'
import { PinnedMessages, type PinnedMessage } from '../components/PinnedMessages'
import { EditMessageModal } from '../components/EditMessageModal'
import { CreatePollModal } from '../components/CreatePollModal'
import { ForwardMessageModal } from '../components/ForwardMessageModal'
import { useSquadMembersQuery } from '../hooks/queries/useSquadMembers'
import { hasPermission, type SquadRole } from '../lib/roles'
import type { MentionUser } from '../components/MentionInput'
import type { PollData } from '../components/ChatPoll'
import { Link } from 'react-router'
import { trackEvent } from '../utils/analytics'
import { CrossfadeTransition, SkeletonChatPage } from '../components/ui'
import { PullToRefresh } from '../components/PullToRefresh'
import { ConversationList } from '../components/messages/ConversationList'
import { ConversationHeader } from '../components/messages/ConversationHeader'
import { MessageThread } from '../components/messages/MessageThread'
import { MessageComposer } from '../components/messages/MessageComposer'
import { MessageToast } from '../components/messages/MessageToast'
import { ThreadView } from '../components/ThreadView'

export function Messages() {
  const { user } = useAuthStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const isKeyboardVisible = useKeyboardVisible()

  const {
    messages: squadMessages,
    conversations: squadConversations,
    activeConversation: activeSquadConv,
    isLoading: isLoadingSquad,
    fetchConversations: fetchSquadConvs,
    setActiveConversation: setActiveSquadConv,
    sendMessage: sendSquadMessage,
    editMessage: editSquadMessage,
    deleteMessage: deleteSquadMessage,
    pinMessage: pinSquadMessage,
    markAsRead: markSquadAsRead,
    unsubscribe: unsubscribeSquad,
  } = useMessagesStore()

  const {
    messages: dmMessages,
    conversations: dmConversations,
    activeConversation: activeDMConv,
    isLoading: isLoadingDM,
    fetchConversations: fetchDMConvs,
    setActiveConversation: setActiveDMConv,
    sendMessage: sendDMMessage,
    unsubscribe: unsubscribeDM,
  } = useDirectMessagesStore()

  const handleRefresh = useCallback(async () => {
    await Promise.all([fetchSquadConvs(), fetchDMConvs()])
  }, [fetchSquadConvs, fetchDMConvs])

  const activeSquadId = activeSquadConv?.squad_id
  const { data: squadMembersData } = useSquadMembersQuery(activeSquadId)
  const mentionMembers: MentionUser[] = useMemo(
    () =>
      (squadMembersData || [])
        .filter((m) => m.user_id !== user?.id)
        .map((m) => ({
          id: m.user_id,
          username: m.profiles?.username || 'Utilisateur',
          avatar_url: m.profiles?.avatar_url || null,
        })),
    [squadMembersData, user?.id]
  )

  const [activeTab, setActiveTab] = useStatePersistence<'squads' | 'dms'>('messages_tab', 'squads')
  const [newMessage, setNewMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [messageSearchQuery, setMessageSearchQuery] = useState('')
  const [showMessageSearch, setShowMessageSearch] = useState(false)
  const [editingMessage, setEditingMessage] = useState<{ id: string; content: string } | null>(null)
  const [replyingTo, setReplyingTo] = useState<{
    id: string
    content: string
    sender: string
  } | null>(null)
  const [showGifPicker, setShowGifPicker] = useState(false)
  const [showPollModal, setShowPollModal] = useState(false)
  const [forwardMessage, setForwardMessage] = useState<{ content: string; sender: string } | null>(
    null
  )
  const [openThreadId, setOpenThreadId] = useState<string | null>(null)
  const [toast, setToast] = useState<{
    message: string
    variant: 'success' | 'error'
    visible: boolean
  }>({ message: '', variant: 'success', visible: false })
  const [isDesktop, setIsDesktop] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // BUG #3: Cap skeleton display at 2s max to prevent perceived broken page
  const [loadingTimedOut, setLoadingTimedOut] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setLoadingTimedOut(true), 2000)
    return () => clearTimeout(timer)
  }, [])

  const isSquadChat = !!activeSquadConv
  const messages = isSquadChat ? squadMessages : dmMessages
  const { typingText, handleTyping } = useTypingIndicator({
    conversationType: isSquadChat ? 'squad' : 'dm',
    conversationId: isSquadChat
      ? activeSquadConv?.squad_id || ''
      : activeDMConv?.other_user_id || '',
    sessionId: activeSquadConv?.session_id,
    currentUsername: user?.user_metadata?.username || user?.email || 'Utilisateur',
  })

  const handleMessageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setNewMessage(e.target.value)
      if (e.target.value.trim()) handleTyping()
    },
    [handleTyping]
  )

  useEffect(() => {
    fetchSquadConvs()
    fetchDMConvs()
    return () => {
      unsubscribeSquad()
      unsubscribeDM()
    }
  }, [fetchSquadConvs, fetchDMConvs, unsubscribeSquad, unsubscribeDM])

  // Handle DM URL param
  useEffect(() => {
    const dmUserId = searchParams.get('dm')
    if (!dmUserId || isLoadingDM) return
    setActiveTab('dms')
    const existing = dmConversations.find((c) => c.other_user_id === dmUserId)
    if (existing) {
      setActiveDMConv(existing)
      setSearchParams({}, { replace: true })
    } else {
      ;(async () => {
        const { supabase } = await import('../lib/supabaseMinimal')
        const { data } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .eq('id', dmUserId)
          .single()
        if (data) {
          setActiveDMConv({
            other_user_id: data.id,
            other_user_username: data.username || 'Utilisateur',
            other_user_avatar_url: data.avatar_url,
            last_message_content: null,
            last_message_at: null,
            last_message_sender_id: null,
            unread_count: 0,
          })
          setSearchParams({}, { replace: true })
        }
      })()
    }
  }, [searchParams, dmConversations, isLoadingDM, setActiveDMConv, setSearchParams])

  // Handle Squad URL param
  useEffect(() => {
    const squadId = searchParams.get('squad')
    if (!squadId || isLoadingSquad) return
    setActiveTab('squads')
    const existing = squadConversations.find((c) => c.squad_id === squadId)
    if (existing) {
      setActiveSquadConv(existing)
      setSearchParams({}, { replace: true })
    } else {
      ;(async () => {
        await fetchSquadConvs()
        const fresh = useMessagesStore.getState().conversations
        const c = fresh.find((c) => c.squad_id === squadId)
        if (c) setActiveSquadConv(c)
        setSearchParams({}, { replace: true })
      })()
    }
  }, [
    searchParams,
    squadConversations,
    isLoadingSquad,
    setActiveSquadConv,
    setSearchParams,
    fetchSquadConvs,
  ])

  const currentMessages = activeSquadConv ? squadMessages : dmMessages
  const messageCount = currentMessages.length
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messageCount])

  const hasEnteredChatRef = useRef(false)
  useEffect(() => {
    const active = !!(activeSquadConv || activeDMConv)
    if (active && !hasEnteredChatRef.current) {
      hasEnteredChatRef.current = true
      setTimeout(() => inputRef.current?.focus(), 100)
    } else if (!active) hasEnteredChatRef.current = false
  }, [activeSquadConv, activeDMConv])

  useEffect(() => {
    if (activeSquadConv) markSquadAsRead(activeSquadConv.squad_id, activeSquadConv.session_id)
  }, [activeSquadConv, markSquadAsRead])

  const handleScroll = useCallback(() => {
    // Keep for future use (e.g. mark-as-read on scroll)
  }, [])
  const showToast = useCallback((msg: string, v: 'success' | 'error' = 'success') => {
    setToast({ message: msg, variant: v, visible: true })
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3000)
  }, [])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || isSending) return
    setIsSending(true)
    const ok = activeSquadConv
      ? await sendSquadMessage(
          newMessage,
          activeSquadConv.squad_id,
          activeSquadConv.session_id,
          replyingTo?.id
        )
      : activeDMConv
        ? await sendDMMessage(newMessage, activeDMConv.other_user_id)
        : null
    if (ok && !ok.error) {
      trackEvent('message_sent', { type: activeSquadConv ? 'squad' : 'dm' })
      setNewMessage('')
      setReplyingTo(null)
    }
    setIsSending(false)
  }

  const handleBack = () => {
    setActiveSquadConv(null)
    setActiveDMConv(null)
  }
  const handleEditMessage = useCallback(
    async (content: string) => {
      if (!editingMessage) return
      const { error } = await editSquadMessage(editingMessage.id, content)
      showToast(
        error ? 'Erreur lors de la modification' : 'Message modifié',
        error ? 'error' : 'success'
      )
      setEditingMessage(null)
    },
    [editingMessage, editSquadMessage, showToast]
  )
  const handleDeleteMessage = useCallback(
    async (id: string) => {
      const { error } = await deleteSquadMessage(id)
      showToast(
        error ? 'Erreur lors de la suppression' : 'Message supprimé',
        error ? 'error' : 'success'
      )
    },
    [deleteSquadMessage, showToast]
  )
  const handlePinMessage = useCallback(
    async (id: string, pin: boolean) => {
      const { error } = await pinSquadMessage(id, pin)
      showToast(
        error ? "Erreur lors de l'épinglage" : pin ? 'Message épinglé' : 'Message désépinglé',
        error ? 'error' : 'success'
      )
    },
    [pinSquadMessage, showToast]
  )
  const handleReply = useCallback((info: { id: string; content: string; sender: string }) => {
    setReplyingTo(info)
    inputRef.current?.focus()
  }, [])
  const handleForwardMessage = useCallback((msg: { content: string; sender: string }) => {
    setForwardMessage(msg)
  }, [])
  const handleOpenThread = useCallback((messageId: string) => {
    setOpenThreadId(messageId)
  }, [])

  const handleCreatePoll = useCallback(
    async (question: string, options: string[]) => {
      const content = JSON.stringify({
        type: 'poll',
        question,
        options,
        votes: {},
        createdBy: user?.id || '',
      } as PollData)
      if (activeSquadConv)
        await sendSquadMessage(content, activeSquadConv.squad_id, activeSquadConv.session_id)
      else if (activeDMConv) await sendDMMessage(content, activeDMConv.other_user_id)
    },
    [user?.id, activeSquadConv, activeDMConv, sendSquadMessage, sendDMMessage]
  )

  const handleLocationShare = useCallback(
    async (lat: number, lng: number) => {
      const content = `[location:${lat},${lng}]`
      if (activeSquadConv)
        await sendSquadMessage(content, activeSquadConv.squad_id, activeSquadConv.session_id)
      else if (activeDMConv) await sendDMMessage(content, activeDMConv.other_user_id)
    },
    [activeSquadConv, activeDMConv, sendSquadMessage, sendDMMessage]
  )

  const handlePollVote = useCallback(
    async (messageId: string, optionIndex: number) => {
      if (!user?.id) return
      const msg = messages.find((m) => m.id === messageId)
      if (!msg?.content) return
      try {
        const poll = JSON.parse(msg.content) as PollData
        if (!poll?.votes) return
        if (!poll.votes[optionIndex]) poll.votes[optionIndex] = []
        if (!poll.votes[optionIndex].includes(user.id)) {
          poll.votes[optionIndex].push(user.id)
          if (isSquadChat) await editSquadMessage(messageId, JSON.stringify(poll))
        }
      } catch {
        /* ignore */
      }
    },
    [user?.id, messages, isSquadChat, editSquadMessage]
  )

  const handleVoiceSend = useCallback(
    async (_blob: Blob, dur: number) => {
      const msg = `🎤 Message vocal (${Math.floor(dur / 60)}:${(dur % 60).toString().padStart(2, '0')})`
      if (activeSquadConv)
        await sendSquadMessage(msg, activeSquadConv.squad_id, activeSquadConv.session_id)
      else if (activeDMConv) await sendDMMessage(msg, activeDMConv.other_user_id)
    },
    [activeSquadConv, activeDMConv, sendSquadMessage, sendDMMessage]
  )

  // Computed
  const currentUserRole: SquadRole = useMemo(() => {
    if (!activeSquadId || !user?.id || !squadMembersData) return 'member'
    return (squadMembersData.find((m) => m.user_id === user.id)?.role as SquadRole) || 'member'
  }, [activeSquadId, user?.id, squadMembersData])
  const isAdmin = hasPermission(currentUserRole, 'pin_message')
  const memberRolesMap = useMemo(() => {
    const m = new Map<string, string>()
    squadMembersData?.forEach((s) => m.set(s.user_id, s.role))
    return m
  }, [squadMembersData])
  const squadUnread = squadConversations.reduce((s, c) => s + c.unread_count, 0)
  const dmUnread = dmConversations.reduce((s, c) => s + c.unread_count, 0)
  const filteredSquadConvs = squadConversations.filter((c) =>
    (c.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  )
  const filteredDMConvs = dmConversations.filter((c) =>
    (c.other_user_username || '').toLowerCase().includes(searchQuery.toLowerCase())
  )
  const isLoading = activeTab === 'squads' ? isLoadingSquad : isLoadingDM
  const getMessageDate = useCallback((d: string) => new Date(d).toDateString(), [])
  const chatName = isSquadChat ? activeSquadConv?.name : activeDMConv?.other_user_username
  const chatSubtitle = isSquadChat
    ? activeSquadConv?.type === 'squad'
      ? 'Chat de squad'
      : 'Chat de session'
    : 'Message privé'

  const pinnedMessages: PinnedMessage[] = useMemo(() => {
    if (!isSquadChat) return []
    return messages
      .filter((m) => m && 'is_pinned' in m && m.is_pinned)
      .map((m) => ({
        pin_id: `pin-${m.id}`,
        message_id: m.id,
        message_content: m.content || '',
        message_sender_id: m.sender_id,
        message_sender_username: m.sender?.username || 'Utilisateur',
        message_created_at: m.created_at,
        pinned_by_id: m.sender_id,
        pinned_by_username: m.sender?.username || 'Utilisateur',
        pinned_at: m.created_at,
      }))
      .slice(0, 25)
  }, [messages, isSquadChat])

  const scrollToMessage = useCallback((id: string) => {
    const el = document.getElementById(`message-${id}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('ring-2', 'ring-warning', 'ring-opacity-50')
      setTimeout(() => el.classList.remove('ring-2', 'ring-warning', 'ring-opacity-50'), 2000)
    }
  }, [])
  const handleTabChange = useCallback(
    (tab: 'squads' | 'dms') => {
      setActiveTab(tab)
      if (tab === 'squads') setActiveDMConv(null)
      else setActiveSquadConv(null)
      setNewMessage('')
      setReplyingTo(null)
    },
    [setActiveDMConv, setActiveSquadConv]
  )
  const handleSelectSquadConv = useCallback(
    (conv: (typeof squadConversations)[0]) => {
      if (activeSquadConv?.id !== conv.id) setActiveDMConv(null)
      setActiveSquadConv(conv)
    },
    [activeSquadConv?.id, setActiveDMConv, setActiveSquadConv]
  )
  const messageSearchCount = messageSearchQuery
    ? messages.filter((m) =>
        (m.content || '').toLowerCase().includes(messageSearchQuery.toLowerCase())
      ).length
    : 0
  const handleGifSelect = useCallback(
    async (url: string) => {
      setShowGifPicker(false)
      if (!url.trim()) return
      setIsSending(true)
      activeSquadConv
        ? await sendSquadMessage(url, activeSquadConv.squad_id, activeSquadConv.session_id)
        : activeDMConv
          ? await sendDMMessage(url, activeDMConv.other_user_id)
          : null
      setIsSending(false)
    },
    [activeSquadConv, activeDMConv, sendSquadMessage, sendDMMessage]
  )

  // Shared props
  const convListProps = {
    activeTab,
    onTabChange: handleTabChange,
    searchQuery,
    onSearchChange: setSearchQuery,
    isLoading,
    squadConversations,
    dmConversations,
    filteredSquadConvs,
    filteredDMConvs,
    activeSquadConvId: activeSquadConv?.id,
    isDesktop,
    squadUnread,
    dmUnread,
    totalUnread: squadUnread + dmUnread,
    onSelectSquadConv: handleSelectSquadConv as any,
    onSelectDMConv: setActiveDMConv,
  }

  // IMPORTANT: renderChatView is a render function, NOT a component.
  // Using an inline component (<ChatView />) would cause React to unmount/remount
  // the entire tree on every parent re-render (realtime updates), which makes
  // MessageReactions re-fetch and blink continuously.
  const renderChatView = (embedded = false) => (
    <div className="flex flex-col h-full bg-bg-base">
      <ConversationHeader
        embedded={embedded}
        isSquadChat={isSquadChat}
        squadConv={
          activeSquadConv ? { type: activeSquadConv.type, name: activeSquadConv.name } : null
        }
        dmConv={
          activeDMConv
            ? {
                other_user_id: activeDMConv.other_user_id,
                other_user_username: activeDMConv.other_user_username,
                other_user_avatar_url: activeDMConv.other_user_avatar_url,
              }
            : null
        }
        chatName={chatName || ''}
        chatSubtitle={chatSubtitle}
        showMessageSearch={showMessageSearch}
        messageSearchQuery={messageSearchQuery}
        messageSearchCount={messageSearchCount}
        onBack={handleBack}
        onToggleSearch={() => {
          setShowMessageSearch((s) => !s)
          setMessageSearchQuery('')
        }}
        onSearchChange={setMessageSearchQuery}
      />
      {isSquadChat && pinnedMessages.length > 0 && (
        <PinnedMessages
          pinnedMessages={pinnedMessages}
          currentUserId={user?.id || ''}
          isAdmin={isAdmin}
          onUnpin={(id) => handlePinMessage(id, false)}
          onScrollToMessage={scrollToMessage}
        />
      )}
      <MessageThread
        messages={messages}
        userId={user?.id}
        isSquadChat={isSquadChat}
        isAdmin={isAdmin}
        isLoading={isLoading}
        embedded={embedded}
        typingText={typingText}
        memberRolesMap={memberRolesMap}
        messagesContainerRef={messagesContainerRef}
        messagesEndRef={messagesEndRef}
        getMessageDate={getMessageDate}
        onEditMessage={setEditingMessage}
        onDeleteMessage={handleDeleteMessage}
        onPinMessage={handlePinMessage}
        onReplyMessage={handleReply}
        onForwardMessage={handleForwardMessage}
        onThreadMessage={isSquadChat ? handleOpenThread : undefined}
        onPollVote={handlePollVote}
        onScrollToMessage={scrollToMessage}
        onScroll={handleScroll}
      />
      <MessageComposer
        embedded={embedded}
        isSquadChat={isSquadChat}
        chatName={chatName || ''}
        newMessage={newMessage}
        isSending={isSending}
        showGifPicker={showGifPicker}
        replyingTo={replyingTo}
        mentionMembers={mentionMembers}
        inputRef={inputRef}
        onMessageChange={setNewMessage}
        onInputChange={handleMessageChange}
        onSubmit={handleSendMessage}
        onCancelReply={() => setReplyingTo(null)}
        onToggleGifPicker={() => setShowGifPicker(!showGifPicker)}
        onGifSelect={handleGifSelect}
        onLocationShare={handleLocationShare}
        onVoiceSend={handleVoiceSend}
        onShowPollModal={() => setShowPollModal(true)}
        onTyping={handleTyping}
      />
      <EditMessageModal
        isOpen={!!editingMessage}
        message={editingMessage || { id: '', content: '' }}
        onSave={handleEditMessage}
        onClose={() => setEditingMessage(null)}
      />
      <CreatePollModal
        isOpen={showPollModal}
        onClose={() => setShowPollModal(false)}
        onCreatePoll={handleCreatePoll}
      />
      <ForwardMessageModal
        isOpen={!!forwardMessage}
        onClose={() => setForwardMessage(null)}
        messageContent={forwardMessage?.content || ''}
        senderUsername={forwardMessage?.sender || ''}
      />
      {isSquadChat && (
        <ThreadView
          threadId={openThreadId || ''}
          isOpen={!!openThreadId}
          onClose={() => setOpenThreadId(null)}
        />
      )}
    </div>
  )

  const toastEl = (
    <MessageToast message={toast.message} isVisible={toast.visible} variant={toast.variant} />
  )

  if (isDesktop)
    return (
      <>
        {toastEl}
        <main className="h-[calc(100dvh-3.5rem)] bg-bg-base mesh-bg flex" aria-label="Messages">
          <nav
            className="w-[340px] xl:w-[380px] flex-shrink-0 border-r border-border-default bg-bg-elevated overflow-hidden"
            aria-label="Conversations"
          >
            <ConversationList showOnDesktop {...convListProps} />
          </nav>
          <div className="flex-1 min-w-0">
            {activeSquadConv || activeDMConv ? (
              renderChatView(true)
            ) : (
              <div className="h-full flex items-center justify-center bg-bg-base">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-2xl bg-primary-10 flex items-center justify-center mx-auto mb-5">
                    <Sparkles className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-xl lg:text-2xl font-semibold font-display text-text-primary mb-2">
                    Ta squad t'attend
                  </h3>
                  <p className="text-base text-text-quaternary max-w-[280px] mx-auto">
                    {squadConversations.length > 0 || dmConversations.length > 0
                      ? 'Choisis une conversation pour retrouver tes potes.'
                      : 'Crée ou rejoins un squad pour commencer à chatter avec ta team.'}
                  </p>
                  {squadConversations.length === 0 && dmConversations.length === 0 && (
                    <Link
                      to="/discover"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-bg text-white text-sm font-medium hover:bg-primary-bg-hover transition-colors mt-4"
                    >
                      Trouver des joueurs
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </>
    )

  const initialMessagesLoading =
    !loadingTimedOut && isLoadingSquad && isLoadingDM && squadConversations.length === 0

  // BUG-7: Show a helpful message when loading takes longer than 2s
  const showSlowLoadingHint =
    loadingTimedOut && isLoadingSquad && isLoadingDM && squadConversations.length === 0

  if (!activeSquadConv && !activeDMConv)
    return (
      <>
        {toastEl}
        <main className="min-h-0 bg-bg-base pb-6 page-enter" aria-label="Messages">
          <PullToRefresh
            onRefresh={handleRefresh}
            className="px-4 md:px-6 lg:px-8 py-6 max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto"
          >
            {showSlowLoadingHint ? (
              <div className="text-center py-12">
                <p className="text-text-tertiary text-base">
                  Le chargement prend plus de temps que prévu...
                </p>
                <p className="text-text-quaternary text-sm mt-2">
                  Vérifie ta connexion ou tire vers le bas pour rafraîchir.
                </p>
              </div>
            ) : (
              <CrossfadeTransition
                isLoading={initialMessagesLoading}
                skeleton={<SkeletonChatPage />}
              >
                <ConversationList {...convListProps} />
              </CrossfadeTransition>
            )}
          </PullToRefresh>
        </main>
      </>
    )

  return (
    <div
      className="fixed inset-x-0 top-0 z-[60] flex flex-col lg:inset-0 lg:z-auto lg:static"
      style={{
        bottom: isKeyboardVisible
          ? '0px'
          : 'calc(80px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      {toastEl}
      {renderChatView()}
    </div>
  )
}

export default Messages
