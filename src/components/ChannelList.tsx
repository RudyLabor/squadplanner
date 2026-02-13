
import { useState, memo } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { Hash, Volume2, Megaphone, Plus, Trash2, X } from './icons'
import { useSquadChannels } from '../hooks/useSquadChannels'
import type { SquadChannel, ChannelType } from '../types/database'

interface ChannelListProps {
  squadId: string
  activeChannelId: string | null
  onSelectChannel: (channel: SquadChannel) => void
  isLeader: boolean
}

const CHANNEL_ICONS: Record<ChannelType, typeof Hash> = {
  text: Hash,
  voice: Volume2,
  announcements: Megaphone,
}

export const ChannelList = memo(function ChannelList({
  squadId,
  activeChannelId,
  onSelectChannel,
  isLeader,
}: ChannelListProps) {
  const { channels, createChannel, deleteChannel, isCreating } = useSquadChannels(squadId)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newChannelName, setNewChannelName] = useState('')
  const [newChannelType, setNewChannelType] = useState<ChannelType>('text')

  const handleCreate = () => {
    if (!newChannelName.trim()) return
    createChannel(newChannelName.trim(), undefined, newChannelType)
    setNewChannelName('')
    setShowCreateForm(false)
  }

  if (channels.length === 0) return null

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between px-2 mb-1">
        <h4 className="text-xs font-semibold text-text-quaternary uppercase tracking-wider">
          Canaux
        </h4>
        {isLeader && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="p-1 rounded text-text-quaternary hover:text-text-secondary hover:bg-bg-hover transition-colors"
            aria-label="Créer un canal"
          >
            {showCreateForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showCreateForm && (
          <m.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-2 pb-2 overflow-hidden"
          >
            <div className="p-3 bg-bg-surface rounded-xl border border-border-default space-y-2">
              <input
                type="text"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                placeholder="nom-du-canal"
                maxLength={50}
                className="w-full px-3 py-1.5 bg-bg-base rounded-lg border border-border-default text-sm text-text-primary placeholder-text-quaternary outline-none focus:border-primary transition-colors"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
              <div className="flex items-center gap-2">
                {(['text', 'voice', 'announcements'] as ChannelType[]).map((type) => {
                  const Icon = CHANNEL_ICONS[type]
                  return (
                    <button
                      key={type}
                      onClick={() => setNewChannelType(type)}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                        newChannelType === type
                          ? 'bg-primary-15 text-primary'
                          : 'text-text-quaternary hover:text-text-secondary'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      {type === 'text' ? 'Texte' : type === 'voice' ? 'Vocal' : 'Annonces'}
                    </button>
                  )
                })}
                <div className="flex-1" />
                <button
                  onClick={handleCreate}
                  disabled={!newChannelName.trim() || isCreating}
                  className="px-3 py-1 rounded-lg text-xs font-medium bg-primary text-white hover:bg-primary-hover disabled:opacity-50 transition-colors"
                >
                  Créer
                </button>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Channel list */}
      {channels.map((channel) => {
        const Icon = CHANNEL_ICONS[channel.channel_type as ChannelType] || Hash
        const isActive = activeChannelId === channel.id

        return (
          <button
            key={channel.id}
            onClick={() => onSelectChannel(channel)}
            className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors group ${
              isActive
                ? 'bg-primary-15 text-primary font-medium'
                : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
            }`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{channel.name}</span>
            {isLeader && !channel.is_default && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  deleteChannel(channel.id)
                }}
                className="ml-auto p-0.5 rounded opacity-0 group-hover:opacity-100 text-text-quaternary hover:text-error transition-all"
                aria-label={`Supprimer le canal ${channel.name}`}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </button>
        )
      })}
    </div>
  )
})
