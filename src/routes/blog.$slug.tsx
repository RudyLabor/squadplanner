import type { LoaderFunction, MetaFunction } from 'react-router'
import { Link, useLoaderData } from 'react-router'
import { m } from 'framer-motion'
import { getBlogPostBySlug, getRelatedPosts, type BlogPost } from '../data/blog-posts'
import { ArrowLeft, Calendar, Clock, Hash, ArrowRight, Sparkles } from '../components/icons'
import { NewsletterCTA } from '../components/landing/NewsletterCTA'
import { PublicPageShell } from '../components/PublicPageShell'
import { scrollReveal, scrollRevealLight, springTap } from '../utils/animations'

export const loader: LoaderFunction = ({ params }) => {
  const { slug } = params
  if (!slug) {
    throw new Response('Not Found', { status: 404 })
  }

  const post = getBlogPostBySlug(slug)
  if (!post) {
    throw new Response('Not Found', { status: 404 })
  }

  const relatedPosts = getRelatedPosts(slug, 2)

  return { post, relatedPosts }
}

export const meta: MetaFunction<typeof loader> = ({ data }: { data: any }) => {
  if (!data?.post) {
    return [
      { title: 'Article non trouvé - Squad Planner' },
      { name: 'description', content: "Cet article n'existe pas ou n'est pas disponible." },
    ]
  }

  const { post } = data

  return [
    {
      title: `${post.title} - Blog Squad Planner`,
    },
    {
      name: 'description',
      content: post.excerpt,
    },
    {
      name: 'robots',
      content: 'index, follow',
    },
    {
      property: 'og:title',
      content: post.title,
    },
    {
      property: 'og:description',
      content: post.excerpt,
    },
    {
      property: 'og:type',
      content: 'article',
    },
    {
      property: 'og:url',
      content: `https://squadplanner.fr/blog/${post.slug}`,
    },
    {
      property: 'article:published_time',
      content: post.date,
    },
    {
      property: 'article:author',
      content: post.author,
    },
    {
      tagName: 'link',
      rel: 'canonical',
      href: `https://squadplanner.fr/blog/${post.slug}`,
    },
  ]
}

function ArticleJsonLd({ post }: { post: BlogPost }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: 'https://squadplanner.fr/og-image.png',
    datePublished: post.date,
    author: {
      '@type': 'Organization',
      name: post.author,
    },
    keywords: post.tags.join(', '),
  }

  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

function RelatedCard({ post }: { post: BlogPost }) {
  const formattedDate = new Date(post.date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <Link to={`/blog/${post.slug}`} className="group block h-full">
      <div className="h-full overflow-hidden rounded-2xl bg-gradient-to-br from-surface-card/80 to-transparent border border-border-subtle hover:border-border-hover transition-all duration-300 hover:shadow-lg">
        <div className="flex h-28 items-center justify-center bg-gradient-to-br from-primary/15 to-primary/5 text-5xl transition-transform duration-300 group-hover:scale-105">
          {post.coverEmoji}
        </div>
        <div className="p-4">
          <h4 className="line-clamp-2 font-semibold text-text-primary transition-colors duration-300 group-hover:text-primary mb-2">
            {post.title}
          </h4>
          <p className="text-xs text-text-quaternary">{formattedDate}</p>
        </div>
      </div>
    </Link>
  )
}

export default function BlogPost() {
  const { post, relatedPosts } = useLoaderData<typeof loader>() as unknown as {
    post: BlogPost
    relatedPosts: BlogPost[]
  }

  const formattedDate = new Date(post.date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <PublicPageShell>
      <ArticleJsonLd post={post} />

      {/* ── Hero Header ── */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 50% 0%, var(--color-primary-12) 0%, transparent 60%)',
            filter: 'blur(40px)',
          }}
        />
        <div className="relative px-4 md:px-6 py-8 md:py-12 max-w-4xl mx-auto">
          {/* Back Link */}
          <m.div
            variants={scrollReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour au blog
            </Link>
          </m.div>

          {/* Title */}
          <m.h1
            variants={scrollReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-extrabold text-gradient-animated text-text-primary mb-6 leading-tight tracking-tight"
          >
            {post.title}
          </m.h1>

          {/* Meta */}
          <m.div
            variants={scrollRevealLight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex flex-col gap-4 md:flex-row md:items-center md:gap-8"
          >
            <div className="flex items-center gap-2 text-sm text-text-tertiary">
              <Calendar className="w-4 h-4 text-primary" />
              <span>{formattedDate}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-text-tertiary">
              <Clock className="w-4 h-4 text-primary" />
              <span>{post.readTime} min de lecture</span>
            </div>

            <div className="text-sm text-text-tertiary">Par {post.author}</div>
          </m.div>

          {/* Tags */}
          <m.div
            variants={scrollRevealLight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex flex-wrap gap-2 mt-6"
          >
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/15 transition-colors"
              >
                <Hash className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </m.div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── Article Content ── */}
      <m.article
        className="blog-article px-4 md:px-6 py-12 md:py-16 max-w-4xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        suppressHydrationWarning
      >
        <div
          className="blog-content prose prose-invert max-w-none [&_h2]:mt-10 [&_h2]:mb-6 [&_h2]:text-3xl [&_h2]:font-bold [&_h2]:text-text-primary [&_h2]:scroll-mt-20 [&_h3]:mt-8 [&_h3]:mb-4 [&_h3]:text-2xl [&_h3]:font-semibold [&_h3]:text-text-primary [&_p]:mb-5 [&_p]:leading-8 [&_p]:text-text-secondary [&_ul]:mb-5 [&_ul]:ml-6 [&_ul]:space-y-3 [&_ul>li]:text-text-secondary [&_ol]:mb-5 [&_ol]:ml-6 [&_ol]:space-y-3 [&_ol>li]:text-text-secondary [&_li]:leading-7 [&_strong]:font-semibold [&_strong]:text-text-primary [&_a]:text-primary [&_a]:underline [&_a]:hover:text-primary/80 [&_a]:transition-colors [&_code]:bg-surface-card [&_code]:border [&_code]:border-border-subtle [&_code]:rounded-lg [&_code]:px-2.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-sm [&_code]:text-text-primary [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-text-tertiary"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </m.article>

      {/* ── Newsletter CTA (R25) ── */}
      <section className="px-4 md:px-6 py-8">
        <div className="max-w-xl mx-auto">
          <NewsletterCTA />
        </div>
      </section>

      <div className="section-divider" />

      {/* ── Related Articles ── */}
      {relatedPosts.length > 0 && (
        <section className="px-4 md:px-6 py-12 md:py-16 bg-gradient-to-b from-primary/[0.015] to-transparent">
          <div className="max-w-5xl mx-auto">
            <m.div
              variants={scrollReveal}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="mb-12"
            >
              <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-2">
                Articles connexes
              </h2>
              <p className="text-text-tertiary">
                Découvre d'autres guides pour maîtriser Squad Planner
              </p>
            </m.div>

            <m.div
              className="grid gap-6 md:grid-cols-2"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ staggerChildren: 0.1, delayChildren: 0.1 }}
              viewport={{ once: true }}
            >
              {relatedPosts.map((relatedPost, i) => (
                <m.div
                  key={relatedPost.slug}
                  variants={scrollRevealLight}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <RelatedCard post={relatedPost} />
                </m.div>
              ))}
            </m.div>
          </div>
        </section>
      )}

      {relatedPosts.length > 0 && <div className="section-divider" />}

      {/* ── CTA Final ── */}
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
                Envie de tester par toi-même ?
              </h2>
              <p className="text-text-tertiary mb-8 text-lg">
                Crée ta squad et mets ces conseils en pratique dès ce soir. C'est gratuit.
              </p>
              <m.div whileHover={{ scale: 1.03, y: -3 }} {...springTap} className="inline-flex">
                <Link
                  to="/auth?mode=register&redirect=onboarding"
                  className="flex items-center gap-2 h-16 px-10 rounded-xl bg-gradient-to-r from-primary to-purple text-white text-xl font-bold mx-auto shadow-lg shadow-primary/20 cta-glow-idle hover:shadow-primary/30 transition-all"
                >
                  Créer ma squad maintenant
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
