import type { Config } from '@react-router/dev/config'

let presets: Config['presets'] = []
try {
  const mod = (await import('@vercel/react-router')) as any
  if (typeof mod.vercelPreset === 'function') {
    presets = [mod.vercelPreset()]
  }
} catch {
  // vercelPreset not available locally, Vercel handles it at deploy time
}

export default {
  appDirectory: 'src',
  ssr: true,
  async prerender() {
    // Import game slugs for dynamic prerendering
    const { getAllGameSlugs } = await import('./src/data/games')
    const gameSlugs = getAllGameSlugs()

    // Import blog slugs for dynamic prerendering
    const { getAllBlogSlugs } = await import('./src/data/blog-posts')
    const blogSlugs = getAllBlogSlugs()

    return [
      // Core pages
      '/',
      '/auth',
      '/legal',
      '/help',
      '/premium',
      '/maintenance',
      // Game pages
      ...gameSlugs.map((s) => `/games/${s}`),
      ...gameSlugs.map((s) => `/lfg/${s}`),
      // Alternative / comparison pages
      '/alternative/guilded',
      '/alternative/gamerlink',
      '/alternative/discord-events',
      '/vs/guilded-vs-squad-planner',
      // Ambassador program
      '/ambassador',
      // Blog (all articles dynamically)
      '/blog',
      ...blogSlugs.map((s) => `/blog/${s}`),
    ]
  },
  presets,
} satisfies Config
