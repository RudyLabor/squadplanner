import type { HeadersFunction, MetaFunction } from 'react-router'
import { Link } from 'react-router'
import { m } from 'framer-motion'
import { getAllBlogPosts } from '../data/blog-posts'
import { Calendar, Clock, Hash } from '../components/icons'
import { PublicPageShell } from '../components/PublicPageShell'

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
      'Découvrez nos guides et astuces pour organiser vos sessions gaming, créer des tournois et gérer votre squad efficacement.',
  },
  {
    name: 'robots',
    content: 'index, follow',
  },
  {
    property: 'og:title',
    content: 'Blog - Squad Planner',
  },
  {
    property: 'og:description',
    content: 'Astuces gaming & organisation pour les squads',
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
    rel: 'canonical',
    href: 'https://squadplanner.fr/blog',
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
        <div className="h-full overflow-hidden rounded-2xl border border-border-subtle bg-surface-card transition-all duration-300 hover:border-primary hover:shadow-lg">
          {/* Cover */}
          <div className="flex h-32 items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 text-6xl transition-transform duration-300 group-hover:scale-105">
            {coverEmoji}
          </div>

          {/* Content */}
          <div className="flex flex-col gap-3 p-5">
            <h3 className="line-clamp-2 text-lg font-bold text-text-primary transition-colors duration-300 group-hover:text-primary">
              {title}
            </h3>

            <p className="line-clamp-2 text-sm text-text-secondary">{excerpt}</p>

            {/* Meta */}
            <div className="flex flex-col gap-3 border-t border-border-subtle pt-3">
              {/* Date & Read Time */}
              <div className="flex items-center gap-4 text-xs text-text-tertiary">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formattedDate}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{readTime} min</span>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
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
  },
)

export default function BlogIndex() {
  const posts = getAllBlogPosts()

  return (
    <PublicPageShell>
      {/* Hero Section */}
      <section className="border-b border-border-subtle bg-gradient-to-b from-primary/5 to-transparent px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true, margin: '-100px' }}
          >
            <h1 className="text-4xl font-bold text-text-primary sm:text-5xl">
              Le Blog Squad Planner
            </h1>
            <p className="mt-4 text-lg text-text-secondary">
              Astuces, guides et actualités pour les gamers organisés
            </p>
          </m.div>
        </div>
      </section>

      {/* Section Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-border-subtle to-transparent" />

      {/* Blog Grid */}
      <section className="px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-6xl">
          {posts.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-text-secondary">Aucun article pour le moment. Revenez bientôt!</p>
            </div>
          ) : (
            <m.div
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ staggerChildren: 0.1, delayChildren: 0.2 }}
              viewport={{ once: true, margin: '-100px' }}
            >
              {posts.map((post, index) => (
                <m.div
                  key={post.slug}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true, margin: '-50px' }}
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

      {/* Section Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-border-subtle to-transparent" />

      {/* CTA Section */}
      <section className="bg-surface-card px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true, margin: '-100px' }}
          >
            <h2 className="text-2xl font-bold text-text-primary">Prêt à organiser ta squad?</h2>
            <p className="mt-4 text-text-secondary">
              Créez votre première squad dès maintenant et mettez nos astuces en pratique.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                to="/squads"
                className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 font-semibold text-white transition-all duration-200 hover:bg-primary/90 active:scale-95"
              >
                Créer une Squad
              </Link>
              <Link
                to="/"
                className="inline-flex items-center justify-center rounded-xl border border-border-subtle bg-surface-card px-6 py-3 font-semibold text-text-primary transition-all duration-200 hover:bg-bg-base"
              >
                En savoir plus
              </Link>
            </div>
          </m.div>
        </div>
      </section>
    </PublicPageShell>
  )
}
