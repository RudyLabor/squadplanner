import type { HeadersFunction, MetaFunction } from 'react-router'
import { Link } from 'react-router'
import { m } from 'framer-motion'
import { getAllBlogPosts } from '../data/blog-posts'
import { Calendar, Clock, Hash, ArrowRight, Sparkles } from '../components/icons'
import { NewsletterCTA } from '../components/landing/NewsletterCTA'
import { PublicPageShell } from '../components/PublicPageShell'
import { scrollReveal, scrollRevealLight, springTap } from '../utils/animations'

export const headers: HeadersFunction = () => ({
  'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
})

export const meta: MetaFunction = () => [
  {
    title: 'Blog - Squad Planner | Astuces Gaming & Organisation',
  },
  {
    name: 'description',
    content:
      'Guides et astuces pour organiser tes sessions gaming, créer des tournois et faire de ta squad une machine de guerre.',
  },
  {
    name: 'robots',
    content: 'index, follow',
  },
  {
    property: 'og:title',
    content: 'Blog - Squad Planner | Astuces Gaming & Organisation',
  },
  {
    property: 'og:description',
    content: 'Guides, astuces et actualités pour les gamers organisés',
  },
  {
    property: 'og:type',
    content: 'website',
  },
  {
    property: 'og:url',
    content: 'https://squadplanner.fr/blog',
  },
  {
    property: 'og:image',
    content: 'https://squadplanner.fr/og-image.png',
  },
  {
    property: 'og:image:width',
    content: '1200',
  },
  {
    property: 'og:image:height',
    content: '630',
  },
  {
    name: 'twitter:card',
    content: 'summary_large_image',
  },
  {
    name: 'twitter:title',
    content: 'Blog - Squad Planner | Astuces Gaming & Organisation',
  },
  {
    name: 'twitter:description',
    content: 'Guides, astuces et actualités pour les gamers organisés',
  },
  {
    name: 'twitter:image',
    content: 'https://squadplanner.fr/og-image.png',
  },
  {
    tagName: 'link',
    rel: 'canonical',
    href: 'https://squadplanner.fr/blog',
  },
  {
    'script:ld+json': {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://squadplanner.fr/' },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://squadplanner.fr/blog' },
      ],
    },
  },
]

const BlogCard = m.create(
  ({
    slug,
    title,
    excerpt,
    date,
    tags,
    readTime,
    coverEmoji,
  }: {
    slug: string
    title: string
    excerpt: string
    date: string
    tags: string[]
    readTime: number
    coverEmoji: string
  }) => {
    const formattedDate = new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    return (
      <Link to={`/blog/${slug}`} className="group block h-full">
        <div className="h-full overflow-hidden rounded-2xl bg-gradient-to-br from-surface-card/80 to-transparent border border-border-subtle hover:border-border-hover transition-all duration-300 hover:shadow-lg">
          {/* Cover */}
          <div className="flex h-40 items-center justify-center bg-gradient-to-br from-primary/15 to-primary/5 text-7xl transition-transform duration-300 group-hover:scale-105">
            {coverEmoji}
          </div>

          {/* Content */}
          <div className="flex flex-col gap-4 p-6">
            <div>
              <h3 className="line-clamp-2 text-lg font-bold text-text-primary transition-colors duration-300 group-hover:text-primary mb-2">
                {title}
              </h3>
              <p className="line-clamp-2 text-sm text-text-tertiary">{excerpt}</p>
            </div>

            {/* Meta */}
            <div className="flex flex-col gap-3 border-t border-border-subtle pt-4">
              {/* Date & Read Time */}
              <div className="flex items-center gap-4 text-xs text-text-quaternary">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-primary/60" />
                  <span>{formattedDate}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-primary/60" />
                  <span>{readTime} min</span>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition-colors duration-200 group-hover:bg-primary/15"
                  >
                    <Hash className="h-3 w-3" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Link>
    )
  }
)

export default function BlogIndex() {
  const posts = getAllBlogPosts()

  return (
    <PublicPageShell>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden noise-overlay">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 50% 0%, var(--color-primary-12) 0%, transparent 60%)',
            filter: 'blur(40px)',
          }}
        />
        <div className="relative px-4 md:px-6 py-16 md:py-24 max-w-5xl mx-auto text-center">
          {/* Badge */}
          <m.div
            variants={scrollReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full badge-shimmer border border-primary/25 mb-8">
              <span className="text-3xl">📚</span>
              <span className="text-base font-medium text-primary">
                Guides Gaming & Organisation
              </span>
            </div>
          </m.div>

          {/* Title */}
          <m.h1
            variants={scrollReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-extrabold text-text-primary mb-6 leading-tight tracking-tight"
          >
            Le Blog
            <br />
            <span className="text-gradient-animated">Squad Planner</span>
          </m.h1>

          <m.p
            variants={scrollRevealLight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-lg md:text-xl text-text-tertiary mb-8 max-w-2xl mx-auto leading-relaxed"
          >
            Guides, astuces et retours d'expérience pour organiser ta squad, éviter les no-shows et
            jouer plus souvent.
          </m.p>

          {/* Quick stats */}
          <div className="flex items-center justify-center gap-8 md:gap-16">
            {[
              { value: `${posts.length}`, label: 'articles' },
              { value: '10+', label: 'min de lecture' },
              { value: '100%', label: 'gratuit' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-xl md:text-2xl font-bold text-text-primary">{stat.value}</div>
                <div className="text-sm md:text-base text-text-quaternary">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── Blog Grid ── */}
      <section className="px-4 md:px-6 py-12 md:py-16">
        <div className="max-w-6xl mx-auto">
          {posts.length === 0 ? (
            <m.div
              variants={scrollReveal}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="py-16 text-center"
            >
              <p className="text-lg text-text-tertiary">
                Aucun article pour le moment. Reviens bientôt !
              </p>
            </m.div>
          ) : (
            <m.div
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ staggerChildren: 0.08, delayChildren: 0.1 }}
              viewport={{ once: true }}
            >
              {posts.map((post, i) => (
                <m.div
                  key={post.slug}
                  variants={scrollRevealLight}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <BlogCard
                    slug={post.slug}
                    title={post.title}
                    excerpt={post.excerpt}
                    date={post.date}
                    tags={post.tags}
                    readTime={post.readTime}
                    coverEmoji={post.coverEmoji}
                  />
                </m.div>
              ))}
            </m.div>
          )}
        </div>
      </section>

      <div className="section-divider" />

      {/* ── Newsletter CTA (R25) ── */}
      <section className="px-4 md:px-6 py-8">
        <div className="max-w-xl mx-auto">
          <NewsletterCTA />
        </div>
      </section>

      {/* ── Explore ── */}
      <section className="px-4 md:px-6 py-12">
        <div className="max-w-5xl mx-auto">
          <m.div variants={scrollReveal} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <h2 className="text-xl font-bold text-text-primary mb-2">Explore aussi</h2>
            <p className="text-text-tertiary mb-6">Toutes nos ressources pour les gamers organisés</p>
          </m.div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { to: '/games/valorant', label: 'Sessions Valorant', desc: 'Planifier tes ranked' },
              { to: '/games/league-of-legends', label: 'Sessions LoL', desc: 'Organise tes Clash' },
              { to: '/alternative/guilded', label: 'Alternative Guilded', desc: 'Guilded a fermé' },
              { to: '/premium', label: 'Premium', desc: 'Squads illimitées' },
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="p-4 rounded-xl border border-border-subtle hover:border-primary/30 bg-surface-card/50 transition-all group"
              >
                <div className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">
                  {link.label}
                </div>
                <p className="text-xs text-text-tertiary mt-1">{link.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── CTA Section ── */}
      <section className="px-4 md:px-6 py-16">
        <div className="max-w-2xl mx-auto">
          <m.div
            variants={scrollReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="relative p-8 md:p-12 rounded-3xl border text-center overflow-hidden"
            style={{
              background:
                'radial-gradient(ellipse at center, var(--color-primary-10) 0%, transparent 60%)',
              borderColor: 'var(--color-primary-20)',
            }}
          >
            <m.div
              className="absolute inset-0"
              animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                background:
                  'radial-gradient(ellipse at center, var(--color-primary-08) 0%, transparent 60%)',
              }}
            />
            <div className="relative z-10">
              <m.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Sparkles className="w-12 h-12 mx-auto mb-6 text-primary" />
              </m.div>
              <h2 className="text-xl md:text-3xl font-bold text-text-primary mb-4">
                Prêt à organiser tes sessions ?
              </h2>
              <p className="text-text-tertiary mb-8 text-lg">
                Crée ta squad, invite tes potes, et mets ces conseils en pratique dès ce soir.
              </p>
              <m.div whileHover={{ scale: 1.03, y: -3 }} {...springTap} className="inline-flex">
                <Link
                  to="/auth?mode=register&redirect=onboarding"
                  className="flex items-center gap-2 h-16 px-10 rounded-xl bg-gradient-to-r from-primary to-purple text-white text-xl font-bold mx-auto shadow-lg shadow-primary/20 cta-glow-idle hover:shadow-primary/30 transition-all"
                >
                  Créer ma squad — c'est gratuit
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </m.div>
              <p className="text-base text-text-quaternary mt-4">
                Gratuit · Pas de carte bancaire · Rejoins en 30 secondes
              </p>
            </div>
          </m.div>
        </div>
      </section>
    </PublicPageShell>
  )
}
