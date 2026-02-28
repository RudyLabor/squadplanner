/**
 * Generate static sitemap.xml during build.
 * Run via: node scripts/generate-sitemap.mjs
 *
 * This creates public/sitemap.xml which Vercel serves as a static file
 * with the correct application/xml content type.
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BASE_URL = 'https://squadplanner.fr'
const today = new Date().toISOString().split('T')[0]

/** Extract blog slugs from blog-posts.ts by regex */
function extractBlogSlugs() {
  const src = readFileSync(resolve(__dirname, '..', 'src', 'data', 'blog-posts.ts'), 'utf-8')
  const matches = [...src.matchAll(/slug:\s*['"]([^'"]+)['"]/g)]
  return matches.map((m) => m[1])
}

function buildUrl(path, priority, changefreq) {
  return `  <url>
    <loc>${BASE_URL}${path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
}

// Game slugs (synced with src/data/games.ts)
const gameSlugs = [
  'valorant',
  'league-of-legends',
  'fortnite',
  'rocket-league',
  'cs2',
  'apex-legends',
  'minecraft',
  'fifa',
  'call-of-duty',
  'overwatch-2',
  'destiny-2',
  'gta-online',
]

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

// Blog pages (dynamically extracted from blog-posts.ts)
const blogSlugs = extractBlogSlugs()
const blogPages = [
  buildUrl('/blog', '0.8', 'weekly'),
  ...blogSlugs.map((slug) => buildUrl(`/blog/${slug}`, '0.7', 'monthly')),
]

// Program pages
const programPages = [buildUrl('/ambassador', '0.7', 'monthly')]

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticPages, ...gamePages, ...altPages, ...blogPages, ...programPages].join('\n')}
</urlset>`

const outPath = resolve(__dirname, '..', 'public', 'sitemap.xml')
writeFileSync(outPath, sitemap, 'utf-8')

const urlCount = sitemap.match(/<url>/g)?.length || 0
console.log(`[sitemap] Generated ${outPath} with ${urlCount} URLs (${today})`)
