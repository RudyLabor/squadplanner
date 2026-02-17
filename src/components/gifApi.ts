import { supabaseMinimal as supabase } from '../lib/supabaseMinimal'

export interface GifResult {
  id: string
  url: string
  preview: string
  width: number
  height: number
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

export async function searchGifs(query: string, limit = 20): Promise<GifResult[]> {
  if (isInCooldown()) return []
  try {
    const { data, error } = await supabase.functions.invoke('giphy-proxy', {
      body: { action: 'search', query, limit },
    })
    if (error) throw error
    return mapResults(data)
  } catch (err) {
    console.warn('[GifPicker] Search error:', err)
    lastErrorTime = Date.now()
    return []
  }
}

export async function fetchTrendingGifs(limit = 20): Promise<GifResult[]> {
  if (isInCooldown()) return []
  try {
    const { data, error } = await supabase.functions.invoke('giphy-proxy', {
      body: { action: 'trending', limit },
    })
    if (error) throw error
    return mapResults(data)
  } catch (err) {
    console.warn('[GifPicker] Trending error:', err)
    lastErrorTime = Date.now()
    return []
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
