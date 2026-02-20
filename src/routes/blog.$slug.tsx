import type { LoaderFunction, MetaFunction } from 'react-router'
import { useParams, Link, useLoaderData } from 'react-router'
import { m } from 'framer-motion'
import { getBlogPostBySlug, getRelatedPosts, type BlogPost } from '../data/blog-posts'
import { ArrowLeft, Calendar, Clock, Hash } from '../components/icons'

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
      content: `https://squadplanner.app/blog/${post.slug}`,
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
      href: `https://squadplanner.app/blog/${post.slug}`,
    },
  ]
}

function ArticleJsonLd({ post }: { post: BlogPost }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: `https://squadplanner.app/og-image.png`,
    datePublished: post.date,
    author: {
      '@type': 'Organization',
      name: post.author,
    },
    keywords: post.tags.join(', '),
  }

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
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
    <>
      <ArticleJsonLd post={post} />

      <div className="min-h-screen bg-bg-base">
        {/* Header */}
        <m.div
          className="border-b border-border-subtle bg-gradient-to-b from-primary/5 to-transparent"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
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
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {post.title}
            </m.h1>

            {/* Meta */}
            <m.div
              className="mt-6 flex flex-col gap-4 border-t border-border-subtle pt-6 sm:flex-row sm:items-center sm:gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
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
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
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

        {/* Content */}
        <m.article
          className="prose prose-invert mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <style>{`
            article h2 {
              margin-top: 2rem;
              margin-bottom: 1rem;
              font-size: 1.875rem;
              font-weight: bold;
              color: var(--color-text-primary);
            }

            article h3 {
              margin-top: 1.5rem;
              margin-bottom: 0.75rem;
              font-size: 1.25rem;
              font-weight: 600;
              color: var(--color-text-primary);
            }

            article p {
              margin-bottom: 1rem;
              line-height: 1.75;
              color: var(--color-text-secondary);
            }

            article ul, article ol {
              margin-bottom: 1rem;
              margin-left: 1.5rem;
              color: var(--color-text-secondary);
            }

            article li {
              margin-bottom: 0.5rem;
              line-height: 1.75;
            }

            article code {
              background-color: var(--color-surface-card);
              border: 1px solid var(--color-border-subtle);
              border-radius: 0.5rem;
              padding: 0.25rem 0.5rem;
              font-family: monospace;
              font-size: 0.875rem;
              color: var(--color-text-primary);
            }

            article strong {
              font-weight: 600;
              color: var(--color-text-primary);
            }

            article a {
              color: var(--color-primary);
              text-decoration: underline;
            }

            article a:hover {
              color: var(--color-primary);
              opacity: 0.8;
            }
          `}</style>

          <div dangerouslySetInnerHTML={{ __html: post.content }} />
        </m.article>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <m.section
            className="border-t border-border-subtle bg-surface-card"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
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

        {/* CTA Section */}
        <m.section
          className="border-t border-border-subtle bg-gradient-to-b from-primary/5 to-transparent px-4 py-12 sm:px-6 lg:px-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
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
      </div>
    </>
  )
}
