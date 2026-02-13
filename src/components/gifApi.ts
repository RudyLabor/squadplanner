import { supabaseMinimal as supabase } from '../lib/supabaseMinimal'

export interface GifResult {
  id: string
  url: string
  preview: string
  width: number
  height: number
}

function mapResults(data: any): GifResult[] {
  return (data.results || []).map((r: any) => ({
    id: r.id,
    url: r.media_formats?.gif?.url || r.media_formats?.tinygif?.url || '',
    preview: r.media_formats?.tinygif?.url || r.media_formats?.gif?.url || '',
    width: r.media_formats?.tinygif?.dims?.[0] || 200,
    height: r.media_formats?.tinygif?.dims?.[1] || 150,
  }))
}

export async function searchGifs(query: string, limit = 20): Promise<GifResult[]> {
  try {
    const { data, error } = await supabase.functions.invoke('tenor-proxy', {
      body: { action: 'search', query, limit },
    })
    if (error) throw error
    return mapResults(data)
  } catch (err) {
    console.warn('[GifPicker] Search error:', err)
    return []
  }
}

export async function fetchTrendingGifs(limit = 20): Promise<GifResult[]> {
  try {
    const { data, error } = await supabase.functions.invoke('tenor-proxy', {
      body: { action: 'featured', limit },
    })
    if (error) throw error
    return mapResults(data)
  } catch (err) {
    console.warn('[GifPicker] Trending error:', err)
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
