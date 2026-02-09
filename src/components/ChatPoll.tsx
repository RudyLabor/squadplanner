/**
 * Phase 4.1.2 — Chat Poll Display + Voting
 * Renders inline polls in chat messages
 */
import { useState, memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, Check, Users } from 'lucide-react'
import { useAuthStore } from '../hooks/useAuth'

export interface PollData {
  type: 'poll'
  question: string
  options: string[]
  votes: Record<string, string[]> // option index → array of user IDs
  createdBy: string
  closed?: boolean
}

export function isPollMessage(content: string): boolean {
  try {
    const parsed = JSON.parse(content)
    return parsed?.type === 'poll'
  } catch {
    return false
  }
}

export function parsePollData(content: string): PollData | null {
  try {
    const parsed = JSON.parse(content)
    if (parsed?.type === 'poll') return parsed as PollData
    return null
  } catch {
    return null
  }
}

interface ChatPollProps {
  pollData: PollData
  messageId: string
  onVote?: (messageId: string, optionIndex: number) => void
  isOwn?: boolean
}

export const ChatPoll = memo(function ChatPoll({ pollData, messageId, onVote, isOwn = false }: ChatPollProps) {
  const { user } = useAuthStore()
  const userId = user?.id
  const [votingIndex, setVotingIndex] = useState<number | null>(null)

  // Find which option current user voted for
  const myVoteIndex = useMemo(() => {
    if (!userId) return -1
    for (const [idx, voters] of Object.entries(pollData.votes)) {
      if (voters.includes(userId)) return parseInt(idx)
    }
    return -1
  }, [pollData.votes, userId])

  const hasVoted = myVoteIndex >= 0

  // Total votes
  const totalVotes = useMemo(() => {
    return Object.values(pollData.votes).reduce((sum, voters) => sum + voters.length, 0)
  }, [pollData.votes])

  const handleVote = async (optionIndex: number) => {
    if (hasVoted || pollData.closed || !onVote) return
    setVotingIndex(optionIndex)
    onVote(messageId, optionIndex)
    setTimeout(() => setVotingIndex(null), 500)
  }

  return (
    <div className={`w-full max-w-[320px] rounded-xl overflow-hidden ${
      isOwn
        ? 'bg-border-hover'
        : 'bg-primary-10 border border-primary'
    }`}>
      {/* Header */}
      <div className="px-4 pt-3 pb-2 flex items-center gap-2">
        <BarChart3 className={`w-4 h-4 ${isOwn ? 'text-white/70' : 'text-primary-hover'}`} />
        <span className={`text-[13px] font-semibold ${isOwn ? 'text-white' : 'text-text-primary'}`}>
          Sondage
        </span>
      </div>

      {/* Question */}
      <div className="px-4 pb-3">
        <p className={`text-[15px] font-medium ${isOwn ? 'text-white' : 'text-text-primary'}`}>
          {pollData.question}
        </p>
      </div>

      {/* Options */}
      <div className="px-3 pb-3 space-y-1.5">
        {pollData.options.map((option, index) => {
          const voters = pollData.votes[index] || []
          const voteCount = voters.length
          const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0
          const isMyVote = myVoteIndex === index
          const isVoting = votingIndex === index

          return (
            <button
              key={index}
              type="button"
              onClick={() => handleVote(index)}
              disabled={hasVoted || pollData.closed}
              className={`w-full relative rounded-lg overflow-hidden transition-colors ${
                hasVoted
                  ? 'cursor-default'
                  : 'hover:bg-border-subtle cursor-pointer'
              }`}
            >
              {/* Background bar */}
              {hasVoted && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className={`absolute inset-0 rounded-lg ${
                    isMyVote
                      ? 'bg-primary-20'
                      : 'bg-border-subtle'
                  }`}
                />
              )}

              <div className="relative flex items-center justify-between px-3 py-2.5">
                <div className="flex items-center gap-2">
                  {isMyVote && (
                    <Check className="w-3.5 h-3.5 text-primary-hover" />
                  )}
                  <span className={`text-[13px] ${
                    isOwn
                      ? 'text-white/90'
                      : isMyVote ? 'text-primary-hover font-medium' : 'text-text-secondary'
                  }`}>
                    {option}
                  </span>
                  {isVoting && (
                    <div className="w-3.5 h-3.5 border-2 border-[#818cf8] border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
                {hasVoted && (
                  <span className={`text-[12px] font-medium ${
                    isOwn ? 'text-white/60' : 'text-text-quaternary'
                  }`}>
                    {percentage}%
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Footer */}
      <div className={`px-4 py-2 border-t flex items-center gap-1.5 ${
        isOwn ? 'border-white/10' : 'border-border-default'
      }`}>
        <Users className={`w-3 h-3 ${isOwn ? 'text-white/40' : 'text-text-quaternary'}`} />
        <span className={`text-[11px] ${isOwn ? 'text-white/40' : 'text-text-quaternary'}`}>
          {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  )
})
