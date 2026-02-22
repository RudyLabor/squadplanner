import { create } from 'zustand'
import { supabaseMinimal as supabase } from '../lib/supabaseMinimal'

// Types
export interface MatchmakingFilters {
  game: string | null
  rank: string | null
  language: string // 'fr' | 'en' | 'es' | 'de' | 'any'
  timezone: string | null
  playStyle: 'competitive' | 'casual' | 'both'
  availableNow: boolean
}

export interface MatchmakingPlayer {
  id: string
  username: string
  avatar_url: string | null
  games: string[]
  rank: string | null
  language: string
  timezone: string
  play_style: string
  reliability_score: number
  xp_level: number
  is_online: boolean
  compatibility_score: number // 0-100
  last_active: string
}

export interface MatchmakingStore {
  players: MatchmakingPlayer[]
  filters: MatchmakingFilters
  isLoading: boolean
  isSearching: boolean
  error: string | null
  likedPlayerIds: Set<string>
  mutualMatches: string[]

  setFilter: (key: keyof MatchmakingFilters, value: any) => void
  resetFilters: () => void
  searchPlayers: () => Promise<void>
  likePlayer: (playerId: string) => Promise<boolean>
  unlikePlayer: (playerId: string) => Promise<void>
  fetchMutualMatches: () => Promise<void>
}

// Constants
export const DEFAULT_FILTERS: MatchmakingFilters = {
  game: null,
  rank: null,
  language: 'fr',
  timezone: null,
  playStyle: 'both',
  availableNow: false,
}

export const RANK_OPTIONS = [
  { value: 'iron', label: 'Fer' },
  { value: 'bronze', label: 'Bronze' },
  { value: 'silver', label: 'Argent' },
  { value: 'gold', label: 'Or' },
  { value: 'platinum', label: 'Platine' },
  { value: 'diamond', label: 'Diamant' },
  { value: 'radiant', label: 'Radiant' },
]

export const PLAY_STYLE_OPTIONS = [
  { value: 'competitive', label: 'Compétitif' },
  { value: 'casual', label: 'Casual' },
  { value: 'both', label: 'Les deux' },
]

export const GAME_OPTIONS = [
  { value: 'valorant', label: 'Valorant' },
  { value: 'cs2', label: 'CS2' },
  { value: 'apex', label: 'Apex Legends' },
  { value: 'fortnite', label: 'Fortnite' },
  { value: 'overwatch2', label: 'Overwatch 2' },
  { value: 'league', label: 'League of Legends' },
  { value: 'dota2', label: 'Dota 2' },
  { value: 'tarkov', label: 'Escape from Tarkov' },
  { value: 'rust', label: 'Rust' },
  { value: 'rainbow6', label: 'Rainbow Six Siege' },
]

const LANGUAGE_OPTIONS = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'Anglais' },
  { value: 'es', label: 'Espagnol' },
  { value: 'de', label: 'Allemand' },
  { value: 'any', label: "N'importe quelle langue" },
]

// Helper: Compute compatibility score
export function computeCompatibility(
  user: {
    timezone: string
    language: string
    reliability_score: number
    xp_level: number
    play_style: string
    is_online: boolean
  },
  candidate: MatchmakingPlayer
): number {
  let score = 0

  // Same timezone = +20
  if (user.timezone === candidate.timezone) {
    score += 20
  }

  // Same language = +20
  if (user.language === candidate.language) {
    score += 20
  }

  // Similar reliability_score (within 15 points) = +20
  if (Math.abs(user.reliability_score - candidate.reliability_score) <= 15) {
    score += 20
  }

  // Similar XP level (within 3 levels) = +15
  if (Math.abs(user.xp_level - candidate.xp_level) <= 3) {
    score += 15
  }

  // Same play_style = +15
  if (user.play_style === candidate.play_style) {
    score += 15
  }

  // Online now = +10
  if (candidate.is_online) {
    score += 10
  }

  return Math.min(100, score)
}

// Zustand Store
export const useMatchmaking = create<MatchmakingStore>((set, get) => ({
  players: [],
  filters: DEFAULT_FILTERS,
  isLoading: false,
  isSearching: false,
  error: null,
  likedPlayerIds: new Set(),
  mutualMatches: [],

  setFilter: (key, value) => {
    set((state) => ({
      filters: {
        ...state.filters,
        [key]: value,
      },
    }))
  },

  resetFilters: () => {
    set({
      filters: DEFAULT_FILTERS,
      players: [],
      error: null,
    })
  },

  searchPlayers: async () => {
    const { filters } = get()
    set({ isSearching: true, error: null })

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Non authentifié')
      }

      // Récupérer le profil utilisateur actuel
      const { data: currentProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
        throw new Error('Impossible de récupérer votre profil')
      }

      // Construire la requête de recherche
      let query = supabase.from('profiles').select('*').neq('id', user.id) // Exclure soi-même

      // Filtre par jeu
      if (filters.game) {
        query = query.contains('games', [filters.game])
      }

      // Filtre par rang
      if (filters.rank) {
        query = query.eq('rank', filters.rank)
      }

      // Filtre par langue
      if (filters.language && filters.language !== 'any') {
        query = query.eq('language', filters.language)
      }

      // Filtre par timezone
      if (filters.timezone) {
        query = query.eq('timezone', filters.timezone)
      }

      // Filtre par style de jeu
      if (filters.playStyle !== 'both') {
        query = query.eq('play_style', filters.playStyle)
      }

      // Filtre par disponibilité maintenant
      if (filters.availableNow) {
        query = query.eq('is_online', true)
      }

      const { data: candidates, error: searchError } = await query

      if (searchError) {
        throw new Error('Erreur lors de la recherche')
      }

      // Récupérer les likes de l'utilisateur
      const { data: likedData } = await supabase
        .from('matchmaking_likes')
        .select('liked_id')
        .eq('liker_id', user.id)

      const likedPlayerIds = new Set(likedData?.map((l) => l.liked_id) || [])

      // Calculer les scores de compatibilité
      const enrichedPlayers: MatchmakingPlayer[] = (candidates || []).map((candidate) => ({
        id: candidate.id,
        username: candidate.username || 'Utilisateur',
        avatar_url: candidate.avatar_url,
        games: candidate.games || [],
        rank: candidate.rank,
        language: candidate.language || 'fr',
        timezone: candidate.timezone || 'UTC',
        play_style: candidate.play_style || 'both',
        reliability_score: candidate.reliability_score || 0,
        xp_level: candidate.xp_level || 0,
        is_online: candidate.is_online || false,
        compatibility_score: computeCompatibility(currentProfile, {
          id: candidate.id,
          username: candidate.username,
          avatar_url: candidate.avatar_url,
          games: candidate.games,
          rank: candidate.rank,
          language: candidate.language,
          timezone: candidate.timezone,
          play_style: candidate.play_style,
          reliability_score: candidate.reliability_score,
          xp_level: candidate.xp_level,
          is_online: candidate.is_online,
          compatibility_score: 0,
          last_active: candidate.last_active,
        }),
        last_active: candidate.last_active || new Date().toISOString(),
      }))

      // Trier par score de compatibilité (décroissant)
      enrichedPlayers.sort((a, b) => b.compatibility_score - a.compatibility_score)

      set({
        players: enrichedPlayers,
        likedPlayerIds: likedPlayerIds as Set<string>,
        isSearching: false,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue'
      set({
        error: message,
        isSearching: false,
        players: [],
      })
    }
  },

  likePlayer: async (playerId: string): Promise<boolean> => {
    const { likedPlayerIds } = get()
    set({ isLoading: true, error: null })

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Non authentifié')
      }

      // Ajouter le like
      const { error: likeError } = await supabase.from('matchmaking_likes').insert({
        liker_id: user.id,
        liked_id: playerId,
        created_at: new Date().toISOString(),
      })

      if (likeError) {
        throw new Error("Impossible d'aimer ce joueur")
      }

      // Mettre à jour l'état local
      const newLikedIds = new Set(likedPlayerIds)
      newLikedIds.add(playerId)
      set({ likedPlayerIds: newLikedIds })

      // Vérifier s'il y a un match mutuel
      const { data: mutualLike } = await supabase
        .from('matchmaking_likes')
        .select('liker_id')
        .eq('liker_id', playerId)
        .eq('liked_id', user.id)
        .single()

      const isMutualMatch = !!mutualLike

      if (isMutualMatch) {
        const { mutualMatches } = get()
        set({
          mutualMatches: [...mutualMatches, playerId],
          isLoading: false,
        })
      } else {
        set({ isLoading: false })
      }

      return isMutualMatch
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue'
      set({
        error: message,
        isLoading: false,
      })
      return false
    }
  },

  unlikePlayer: async (playerId: string) => {
    const { likedPlayerIds } = get()
    set({ isLoading: true, error: null })

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Non authentifié')
      }

      // Supprimer le like
      const { error: unlikeError } = await supabase
        .from('matchmaking_likes')
        .delete()
        .eq('liker_id', user.id)
        .eq('liked_id', playerId)

      if (unlikeError) {
        throw new Error('Impossible de retirer le like')
      }

      // Mettre à jour l'état local
      const newLikedIds = new Set(likedPlayerIds)
      newLikedIds.delete(playerId)

      const { mutualMatches } = get()
      const newMutualMatches = mutualMatches.filter((id) => id !== playerId)

      set({
        likedPlayerIds: newLikedIds,
        mutualMatches: newMutualMatches,
        isLoading: false,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue'
      set({
        error: message,
        isLoading: false,
      })
    }
  },

  fetchMutualMatches: async () => {
    set({ isLoading: true, error: null })

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Non authentifié')
      }

      // Récupérer tous les likes reçus par l'utilisateur
      const { data: receivedLikes, error: receivedError } = await supabase
        .from('matchmaking_likes')
        .select('liker_id')
        .eq('liked_id', user.id)

      if (receivedError) {
        throw new Error('Erreur lors de la récupération des correspondances')
      }

      // Récupérer tous les likes de l'utilisateur
      const { data: sentLikes, error: sentError } = await supabase
        .from('matchmaking_likes')
        .select('liked_id')
        .eq('liker_id', user.id)

      if (sentError) {
        throw new Error('Erreur lors de la récupération des correspondances')
      }

      const receivedLikerIds = new Set<string>(
        (receivedLikes?.map((l: any) => l.liker_id) || []) as string[]
      )
      const sentLikedIds = new Set<string>(
        (sentLikes?.map((l: any) => l.liked_id) || []) as string[]
      )

      // Trouver les matches mutuels
      const mutualMatches = Array.from(sentLikedIds).filter((id) => receivedLikerIds.has(id))

      set({
        mutualMatches,
        likedPlayerIds: sentLikedIds,
        isLoading: false,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue'
      set({
        error: message,
        isLoading: false,
      })
    }
  },
}))
