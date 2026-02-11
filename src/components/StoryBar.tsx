"use client";

import { useState, memo, useRef } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { Plus, X } from './icons'
import { useStories, STORY_BACKGROUNDS } from '../hooks/useStories'
import { StoryViewer } from './StoryViewer'

function StoryCircle({ username, avatarUrl, hasUnviewed, isOwnStory, storyCount, onClick }: {
  username: string; avatarUrl: string | null; hasUnviewed: boolean; isOwnStory: boolean; storyCount: number; onClick: () => void
}) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 flex-shrink-0 w-16">
      <div className={`relative w-14 h-14 rounded-full p-0.5 ${
        hasUnviewed ? 'bg-gradient-to-tr from-primary to-success' : 'bg-border-default'
      }`}>
        <div className="w-full h-full rounded-full bg-bg-elevated p-0.5">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            <div className="w-full h-full rounded-full bg-primary-20 flex items-center justify-center text-lg font-bold text-primary">
              {username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        {isOwnStory && (
          <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center border-2 border-bg-elevated">
            <Plus className="w-3 h-3 text-white" />
          </div>
        )}
        {storyCount > 1 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-white text-2xs font-bold flex items-center justify-center border border-bg-elevated">
            {storyCount}
          </span>
        )}
      </div>
      <span className="text-xs text-text-tertiary truncate w-full text-center">
        {isOwnStory ? 'Ma story' : username}
      </span>
    </button>
  )
}

function CreateStoryModal({ isOpen, onClose, onSubmit }: {
  isOpen: boolean; onClose: () => void; onSubmit: (content: string, bg: string) => void
}) {
  const [content, setContent] = useState('')
  const [selectedBg, setSelectedBg] = useState<string>(STORY_BACKGROUNDS[0].color)

  const handleSubmit = () => {
    if (!content.trim()) return
    onSubmit(content.trim(), selectedBg)
    setContent('')
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center px-4"
          onClick={onClose}
        >
          <m.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="w-full max-w-sm rounded-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div
              className="h-[300px] flex items-center justify-center px-8 relative"
              style={{ backgroundColor: selectedBg }}
            >
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Ecris ta story..."
                maxLength={200}
                className="w-full text-xl font-bold text-center text-white bg-transparent placeholder-white/50 outline-none resize-none"
                rows={4}
                autoFocus
              />
              <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-full bg-black/30 text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-bg-elevated p-4 space-y-3">
              <div className="flex items-center gap-2">
                {STORY_BACKGROUNDS.map(bg => (
                  <button
                    key={bg.color}
                    onClick={() => setSelectedBg(bg.color)}
                    className={`w-8 h-8 rounded-full transition-transform ${
                      selectedBg === bg.color ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-bg-elevated' : ''
                    }`}
                    style={{ backgroundColor: bg.color }}
                    aria-label={bg.label}
                  />
                ))}
              </div>
              <button
                onClick={handleSubmit}
                disabled={!content.trim()}
                className="w-full py-2.5 rounded-xl bg-primary text-white font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors"
              >
                Publier la story
              </button>
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  )
}

export const StoryBar = memo(function StoryBar() {
  const { storyUsers, isLoading, createStory, viewStory, getUserStories } = useStories()
  const [viewingUserId, setViewingUserId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  if (isLoading || storyUsers.length === 0) return null

  const viewingStories = viewingUserId ? getUserStories(viewingUserId) : []

  const handleCreateStory = (content: string, bg: string) => {
    createStory({
      contentType: 'text',
      content,
      backgroundColor: bg,
    })
  }

  return (
    <>
      <div className="mb-4">
        <div ref={scrollRef} className="flex items-start gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1">
          {!storyUsers.some(u => u.isOwnStory) && (
            <button onClick={() => setShowCreate(true)} className="flex flex-col items-center gap-1 flex-shrink-0 w-16">
              <div className="w-14 h-14 rounded-full bg-bg-surface border-2 border-dashed border-border-default flex items-center justify-center">
                <Plus className="w-6 h-6 text-text-tertiary" />
              </div>
              <span className="text-xs text-text-tertiary">Story</span>
            </button>
          )}

          {storyUsers.map(su => (
            <StoryCircle
              key={su.userId}
              username={su.username}
              avatarUrl={su.avatarUrl}
              hasUnviewed={su.hasUnviewed}
              isOwnStory={su.isOwnStory}
              storyCount={su.storyCount}
              onClick={() => su.isOwnStory && su.storyCount === 0 ? setShowCreate(true) : setViewingUserId(su.userId)}
            />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {viewingUserId && viewingStories.length > 0 && (
          <StoryViewer
            stories={viewingStories}
            startIndex={0}
            onClose={() => setViewingUserId(null)}
            onView={viewStory}
          />
        )}
      </AnimatePresence>

      <CreateStoryModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreateStory}
      />
    </>
  )
})
