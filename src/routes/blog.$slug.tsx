import type { LoaderFunction, MetaFunction } from 'react-router'
import { useParams, Link, useLoaderData } from 'react-router'
import { m } from 'framer-motion'
import { getBlogPostBySlug, getRelatedPosts, type BlogPost } from '../data/blog-posts'
import { ArrowLeft, Calendar, Clock, Hash } from '../components/icons'
import { PublicPageShell } from '../components/PublicPageShell'

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

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data?.post) {
    return [{ title: 'Article non trouvé' }]
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
    image: `https://squadplanner.fr/og-image.png`,
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

function RelatedCard({
  post,
  layout,
}: {
  post: BlogPost
  layout?: 'horizontal' | 'vertical'
}) {
  const formattedDate = new Date(post.date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  if (layout === 'horizontal') {
    return (
      <Link to={`/blog/${post.slug}`} className="group block">
        <div className="flex gap-4 rounded-xl border border-border-subtle bg-surface-card p-4 transition-all duration-300 hover:border-primary hover:shadow-md">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-2xl">
            {post.coverEmoji}
          </div>
          <div className="flex flex-col gap-2">
            <h4 className="line-clamp-2 font-semibold text-text-primary transition-colors duration-300 group-hover:text-primary">
              {post.title}
            </h4>
            <p className="text-xs text-text-tertiary">{formattedDate}</p>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link to={`/blog/${post.slug}`} className="group block">
      <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface-card transition-all duration-300 hover:border-primary hover:shadow-md">
        <div className="flex h-24 items-center justify-center bg-primary/10 text-4xl">
          {post.coverEmoji}
        </div>
        <div className="p-4">
          <h4 className="line-clamp-2 font-semibold text-text-primary transition-colors duration-300 group-hover:text-primary">
            {post.title}
          </h4>
          <p className="mt-2 text-xs text-text-tertiary">{formattedDate}</p>
        </div>
      </div>
    </Link>
  )
}

export default function BlogPost() {
  const { post, relatedPosts } = useLoaderData<typeof loader>()

  const formattedDate = new Date(post.date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <PublicPageShell>
      <ArticleJsonLd post={post} />

      {/* Header */}
      <m.div
        className="border-b border-border-subtle bg-gradient-to-b from-primary/5 to-transparent"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true, margin: '-100px' }}
      >
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Back Link */}
          <Link
            to="/blog"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors duration-200 hover:text-primary/80"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au blog
          </Link>

          {/* Title */}
          <m.h1
            className="text-4xl font-bold text-text-primary sm:text-5xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true, margin: '-100px' }}
          >
            {post.title}
          </m.h1>

          {/* Meta */}
          <m.div
            className="mt-6 flex flex-col gap-4 border-t border-border-subtle pt-6 sm:flex-row sm:items-center sm:gap-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true, margin: '-100px' }}
          >
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Calendar className="h-4 w-4 text-primary" />
              <span>{formattedDate}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Clock className="h-4 w-4 text-primary" />
              <span>{post.readTime} min de lecture</span>
            </div>

            <div className="text-sm text-text-secondary">Par {post.author}</div>
          </m.div>

          {/* Tags */}
          <m.div
            className="mt-4 flex flex-wrap gap-2"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true, margin: '-100px' }}
          >
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
              >
                <Hash className="h-3 w-3" />
                {tag}
              </span>
            ))}
          </m.div>
        </div>
      </m.div>

      {/* Section Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-border-subtle to-transparent" />

      {/* Content */}
      <m.article
        className="blog-article mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true, margin: '-100px' }}
        suppressHydrationWarning
      >
        <div
          className="blog-content [&_h2]:mt-8 [&_h2]:mb-4 [&_h2]:text-3xl [&_h2]:font-bold [&_h2]:text-text-primary [&_h3]:mt-6 [&_h3]:mb-3 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-text-primary [&_p]:mb-4 [&_p]:leading-7 [&_p]:text-text-secondary [&_ul]:mb-4 [&_ul]:ml-6 [&_ul]:text-text-secondary [&_ol]:mb-4 [&_ol]:ml-6 [&_ol]:text-text-secondary [&_li]:mb-2 [&_li]:leading-7 [&_strong]:font-semibold [&_strong]:text-text-primary [&_a]:text-primary [&_a]:underline [&_code]:bg-surface-card [&_code]:border [&_code]:border-border-subtle [&_code]:rounded-lg [&_code]:px-2 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-sm [&_code]:text-text-primary"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </m.article>

      {/* Section Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-border-subtle to-transparent" />

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <m.section
          className="bg-surface-card"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true, margin: '-100px' }}
        >
          <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
            <h2 className="mb-6 text-2xl font-bold text-text-primary">Articles connexes</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {relatedPosts.map((relatedPost) => (
                <RelatedCard key={relatedPost.slug} post={relatedPost} />
              ))}
            </div>
          </div>
        </m.section>
      )}

      {/* Section Divider */}
      {relatedPosts.length > 0 && (
        <div className="h-px bg-gradient-to-r from-transparent via-border-subtle to-transparent" />
      )}

      {/* CTA Section */}
      <m.section
        className="bg-gradient-to-b from-primary/5 to-transparent px-4 py-12 sm:px-6 lg:px-8"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true, margin: '-100px' }}
      >
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-text-primary">
            Prêt à mettre en pratique?
          </h2>
          <p className="mt-4 text-text-secondary">
            Rejoignez Squad Planner et organise ta squad dès maintenant.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/squads"
              className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 font-semibold text-white transition-all duration-200 hover:bg-primary/90 active:scale-95"
            >
              Créer une Squad
            </Link>
            <Link
              to="/blog"
              className="inline-flex items-center justify-center rounded-xl border border-border-subtle bg-bg-base px-6 py-3 font-semibold text-text-primary transition-all duration-200 hover:bg-surface-card"
            >
              Voir tous les articles
            </Link>
          </div>
        </div>
      </m.section>
    </PublicPageShell>
  )
}
