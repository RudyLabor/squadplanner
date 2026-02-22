import { supabaseMinimal as supabase } from '../lib/supabaseMinimal'

export interface GifResult {
  id: string
  url: string
  preview: string
  width: number
  height: number
}

export interface GifResponse {
  results: GifResult[]
  error: string | null
}

// Prevent retry storms: track last error time per action
let lastErrorTime = 0
const ERROR_COOLDOWN_MS = 30_000 // 30s cooldown after a failure

function isInCooldown(): boolean {
  return Date.now() - lastErrorTime < ERROR_COOLDOWN_MS
}

interface GiphyImage {
  url?: string
  width?: string
  height?: string
}

interface GiphyResult {
  id: string
  images?: {
    original?: GiphyImage
    fixed_width_small?: GiphyImage
    fixed_width?: GiphyImage
  }
}

interface GiphyResponse {
  data?: GiphyResult[]
  error?: string
}

function mapResults(data: GiphyResponse): GifResult[] {
  return (data.data || []).map((r) => ({
    id: r.id,
    url: r.images?.original?.url || r.images?.fixed_width?.url || '',
    preview: r.images?.fixed_width_small?.url || r.images?.fixed_width?.url || '',
    width: parseInt(r.images?.fixed_width_small?.width || '200', 10),
    height: parseInt(r.images?.fixed_width_small?.height || '150', 10),
  }))
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  if (err && typeof err === 'object' && 'message' in err)
    return String((err as { message: unknown }).message)
  return 'Erreur inconnue'
}

export async function searchGifs(query: string, limit = 20): Promise<GifResponse> {
  if (isInCooldown())
    return { results: [], error: 'Trop de requêtes — réessaie dans quelques secondes' }
  try {
    const { data, error } = await supabase.functions.invoke('giphy-proxy', {
      body: { action: 'search', query, limit },
    })
    if (error) {
      // Try to extract detail from FunctionsHttpError
      let detail = getErrorMessage(error)
      try {
        const body = await error.context?.json?.()
        if (body?.error) detail = body.error
      } catch {
        /* ignore */
      }
      console.error('[GifPicker] Search error:', detail, error)
      lastErrorTime = Date.now()
      return { results: [], error: detail }
    }
    // Check if response body itself has an error field
    if (data?.error) {
      console.error('[GifPicker] GIPHY API error:', data.error)
      lastErrorTime = Date.now()
      return { results: [], error: data.error }
    }
    return { results: mapResults(data), error: null }
  } catch (err) {
    const msg = getErrorMessage(err)
    console.error('[GifPicker] Search error:', msg, err)
    lastErrorTime = Date.now()
    return { results: [], error: msg }
  }
}

export async function fetchTrendingGifs(limit = 20): Promise<GifResponse> {
  if (isInCooldown())
    return { results: [], error: 'Trop de requêtes — réessaie dans quelques secondes' }
  try {
    const { data, error } = await supabase.functions.invoke('giphy-proxy', {
      body: { action: 'trending', limit },
    })
    if (error) {
      let detail = getErrorMessage(error)
      try {
        const body = await error.context?.json?.()
        if (body?.error) detail = body.error
      } catch {
        /* ignore */
      }
      console.error('[GifPicker] Trending error:', detail, error)
      lastErrorTime = Date.now()
      return { results: [], error: detail }
    }
    if (data?.error) {
      console.error('[GifPicker] GIPHY API error:', data.error)
      lastErrorTime = Date.now()
      return { results: [], error: data.error }
    }
    return { results: mapResults(data), error: null }
  } catch (err) {
    const msg = getErrorMessage(err)
    console.error('[GifPicker] Trending error:', msg, err)
    lastErrorTime = Date.now()
    return { results: [], error: msg }
  }
}

export const CATEGORIES = [
  { label: 'GG', query: 'gg gaming' },
  { label: 'Rage', query: 'rage gaming' },
  { label: 'Victoire', query: 'victory celebration gaming' },
  { label: 'Fail', query: 'epic fail gaming' },
  { label: 'LOL', query: 'laughing gaming' },
  { label: 'Sad', query: 'sad gaming' },
]
