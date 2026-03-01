import { useState, useCallback } from 'react'
import { Send, Loader2, BarChart3, X } from '../icons'
import { Button } from '../ui'
import { MentionInput, type MentionUser } from '../MentionInput'
import { GifPicker } from '../GifPicker'
import { VoiceRecorder } from '../VoiceRecorder'
import { LocationShareButton } from '../LocationShare'
import { ReplyComposer } from '../ReplyComposer'
import { PremiumGate } from '../PremiumGate'

interface MessageComposerProps {
  embedded: boolean
  isSquadChat: boolean
  chatName: string
  newMessage: string
  isSending: boolean
  showGifPicker: boolean
  replyingTo: { id: string; content: string; sender: string } | null
  mentionMembers: MentionUser[]
  inputRef: React.RefObject<HTMLInputElement | null>
  onMessageChange: (value: string) => void
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSubmit: (e: React.FormEvent) => void
  onCancelReply: () => void
  onToggleGifPicker: () => void
  onGifSelect: (gifUrl: string) => void
  onLocationShare: (lat: number, lng: number) => void
  onVoiceSend: (blob: Blob, duration: number) => void
  onShowPollModal: () => void
  onTyping: () => void
}

export function MessageComposer({
  embedded,
  isSquadChat,
  chatName,
  newMessage,
  isSending,
  showGifPicker,
  replyingTo,
  mentionMembers,
  inputRef,
  onMessageChange,
  onInputChange,
  onSubmit,
  onCancelReply,
  onToggleGifPicker,
  onGifSelect,
  onLocationShare,
  onVoiceSend,
  onShowPollModal,
  onTyping,
}: MessageComposerProps) {
  const [isVoiceActive, setIsVoiceActive] = useState(false)
  const handleRecordingChange = useCallback((active: boolean) => setIsVoiceActive(active), [])

  return (
    <div
      className={`flex-shrink-0 px-4 py-3 ${embedded ? 'pb-3' : 'pb-6'} border-t border-border-default ${embedded ? '' : 'bg-bg-elevated/80 backdrop-blur-xl'}`}
    >
      <div className={embedded ? '' : 'max-w-4xl lg:max-w-5xl mx-auto'}>
        {/* Reply preview */}
        <ReplyComposer
          replyingTo={
            replyingTo
              ? {
                  id: replyingTo.id,
                  sender_username: replyingTo.sender,
                  content: replyingTo.content,
                }
              : null
          }
          onCancel={onCancelReply}
        />

        <form onSubmit={onSubmit}>
          <div className="flex items-center gap-1.5">
            {/* Hide input & action buttons when voice recorder is active */}
            {!isVoiceActive && (
              <>
                {isSquadChat ? (
                  <MentionInput
                    value={newMessage}
                    onChange={(val) => {
                      onMessageChange(val)
                      if (val.trim()) onTyping()
                    }}
                    onSubmit={() => {
                      if (newMessage.trim() && !isSending)
                        onSubmit({ preventDefault: () => {} } as React.FormEvent)
                    }}
                    placeholder={`Écris à ${chatName}…`}
                    disabled={isSending}
                    members={mentionMembers}
                    inputRef={inputRef}
                  />
                ) : (
                  <div className="flex-1 relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={newMessage}
                      onChange={onInputChange}
                      placeholder={`Message à ${chatName}…`}
                      aria-label={`Écrire un message à ${chatName}`}
                      className="w-full h-12 px-4 bg-bg-surface border border-border-default rounded-xl text-base text-text-primary placeholder:text-text-quaternary focus:outline-none focus:border-primary transition-colors"
                      autoComplete="off"
                      autoCapitalize="off"
                      autoCorrect="off"
                      spellCheck={false}
                      enterKeyHint="send"
                      inputMode="text"
                    />
                  </div>
                )}

                <LocationShareButton onShare={onLocationShare} disabled={isSending} />

                {isSquadChat && (
                  <PremiumGate feature="polls" fallback="hide">
                    <button
                      type="button"
                      onClick={onShowPollModal}
                      className="flex p-2.5 rounded-xl text-text-quaternary hover:text-primary-hover hover:bg-primary-10 transition-colors"
                      aria-label="Créer un sondage"
                      title="Sondage"
                    >
                      <BarChart3 className="w-5 h-5" />
                    </button>
                  </PremiumGate>
                )}

                <PremiumGate feature="gifs" fallback="hide">
                  <div className="relative flex-shrink-0">
                    <button
                      type="button"
                      onClick={onToggleGifPicker}
                      className="p-2 rounded-xl text-text-secondary hover:text-primary-hover hover:bg-primary-10 transition-colors text-sm font-bold"
                      aria-label="Envoyer un GIF"
                    >
                      GIF
                    </button>
                    <GifPicker
                      isOpen={showGifPicker}
                      onSelect={onGifSelect}
                      onClose={() => onToggleGifPicker()}
                    />
                  </div>
                </PremiumGate>
              </>
            )}

            {/* Voice recorder — single instance, takes full width when active */}
            {!newMessage.trim() && (
              <div className={isVoiceActive ? 'flex-1' : ''}>
                <PremiumGate feature="voice_messages" fallback="hide">
                  <VoiceRecorder
                    onSend={async (blob, dur) => onVoiceSend(blob, dur)}
                    disabled={isSending}
                    onRecordingChange={handleRecordingChange}
                  />
                </PremiumGate>
              </div>
            )}

            {!isVoiceActive && (
              <Button
                type="submit"
                disabled={!newMessage.trim() || isSending}
                className="w-11 h-11 p-0 rounded-xl flex-shrink-0"
                aria-label="Envoyer le message"
              >
                {isSending ? (
                  <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="w-5 h-5" aria-hidden="true" />
                )}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
