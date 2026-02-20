
import { useState } from 'react'
import { m } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, Eye } from './icons'
import type { FeedStory } from '../types/database'

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "A l'instant"
  if (minutes < 60) return `Il y a ${minutes}min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Il y a ${hours}h`
  return 'Il y a 1j'
}

export function StoryViewer({
  stories,
  startIndex,
  onClose,
  onView,
}: {
  stories: FeedStory[]
  startIndex: number
  onClose: () => void
  onView: (storyId: string) => void
}) {
  const [currentIndex, setCurrentIndex] = useState(startIndex)
  const story = stories[currentIndex]
  if (!story) return null

  const goNext = () => {
    if (currentIndex < stories.length - 1) {
      onView(story.story_id)
      setCurrentIndex((i) => i + 1)
    } else {
      onView(story.story_id)
      onClose()
    }
  }

  const goPrev = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1)
  }

  const timeAgo = getTimeAgo(story.created_at)

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      <m.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        className="relative w-full max-w-sm h-[80vh] max-h-[700px] rounded-2xl overflow-hidden"
        style={{ backgroundColor: story.background_color }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 flex gap-1 px-3 pt-2 z-10">
          {stories.map((_, i) => (
            <div key={i} className="flex-1 h-0.5 rounded-full bg-white/30 overflow-hidden">
              <div
                className={`h-full rounded-full bg-white transition-all duration-300 ${
                  i < currentIndex ? 'w-full' : i === currentIndex ? 'w-1/2' : 'w-0'
                }`}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-4 left-0 right-0 flex items-center gap-3 px-4 pt-2 z-10">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {story.avatar_url ? (
              <img
                src={story.avatar_url}
                alt=""
                className="w-8 h-8 rounded-full object-cover border border-white/30"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold text-white">
                {story.username.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{story.username}</p>
              <p className="text-xs text-white/60">{timeAgo}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-white/60">
            <Eye className="w-3.5 h-3.5" />
            <span className="text-xs">{story.view_count}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="absolute inset-0 flex items-center justify-center px-8">
          {story.content_type === 'image' && story.media_url ? (
            <img
              src={story.media_url}
              alt=""
              className="max-w-full max-h-full object-contain rounded-lg"
              loading="eager"
              decoding="async"
              fetchPriority="high"
            />
          ) : (
            <p
              className="text-xl md:text-2xl font-bold text-center leading-relaxed"
              style={{ color: story.text_color }}
            >
              {story.content}
            </p>
          )}
        </div>

        {/* Navigation */}
        <button
          onClick={goPrev}
          className="absolute left-0 top-0 bottom-0 w-1/3 z-10"
          aria-label="Precedent"
        />
        <button
          onClick={goNext}
          className="absolute right-0 top-0 bottom-0 w-1/3 z-10"
          aria-label="Suivant"
        />

        {/* Navigation arrows */}
        {currentIndex > 0 && (
          <button
            onClick={goPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors z-20"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        {currentIndex < stories.length - 1 && (
          <button
            onClick={goNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors z-20"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </m.div>
    </m.div>
  )
}
