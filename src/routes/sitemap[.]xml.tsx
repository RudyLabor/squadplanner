import { getAllGameSlugs } from '../data/games'

const BASE_URL = 'https://squadplanner.fr'

function buildUrl(path: string, priority: string, changefreq: string, lastmod?: string): string {
  return `  <url>
    <loc>${BASE_URL}${path}</loc>
    <lastmod>${lastmod || new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
}

export function loader() {
  const gameSlugs = getAllGameSlugs()

  // Static pages
  const staticPages = [
    buildUrl('/', '1.0', 'weekly'),
    buildUrl('/auth', '0.8', 'monthly'),
    buildUrl('/premium', '0.9', 'weekly'),
    buildUrl('/help', '0.7', 'monthly'),
    buildUrl('/legal', '0.3', 'yearly'),
  ]

  // Game pages
  const gamePages = gameSlugs.flatMap((slug) => [
    buildUrl(`/games/${slug}`, '0.8', 'weekly'),
    buildUrl(`/lfg/${slug}`, '0.8', 'weekly'),
  ])

  // Alternative / comparison pages
  const altPages = [
    buildUrl('/alternative/guilded', '0.9', 'monthly'),
    buildUrl('/alternative/gamerlink', '0.7', 'monthly'),
    buildUrl('/alternative/discord-events', '0.7', 'monthly'),
    buildUrl('/vs/guilded-vs-squad-planner', '0.8', 'monthly'),
  ]

  // Blog pages
  const blogPages = [
    buildUrl('/blog', '0.8', 'weekly'),
    buildUrl('/blog/guilded-alternatives-2026', '0.7', 'monthly'),
    buildUrl('/blog/organiser-tournoi-entre-amis', '0.7', 'monthly'),
    buildUrl('/blog/squad-ghost-astuces', '0.7', 'monthly'),
  ]

  // Program pages
  const programPages = [buildUrl('/ambassador', '0.7', 'monthly')]

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticPages, ...gamePages, ...altPages, ...blogPages, ...programPages].join('\n')}
</urlset>`

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
    },
  })
}

// No default export — this is a Resource Route.
// React Router returns the loader Response as-is (raw XML) when there is no component.
