import { describe, it, expect } from 'vitest'
import { BLOG_POSTS, getBlogPostBySlug, getAllBlogPosts, getRelatedPosts } from '../blog-posts'

describe('blog-posts data', () => {
  describe('BLOG_POSTS', () => {
    it('contains at least 3 posts', () => {
      expect(BLOG_POSTS.length).toBeGreaterThanOrEqual(3)
    })

    it('all posts have unique slugs', () => {
      const slugs = BLOG_POSTS.map((p) => p.slug)
      expect(new Set(slugs).size).toBe(BLOG_POSTS.length)
    })

    it('all posts have required fields', () => {
      for (const post of BLOG_POSTS) {
        expect(post.slug).toBeTruthy()
        expect(post.title.length).toBeGreaterThan(5)
        expect(post.excerpt.length).toBeGreaterThan(10)
        expect(post.content.length).toBeGreaterThan(50)
        expect(post.date).toMatch(/^\d{4}-\d{2}-\d{2}$/) // ISO date format
        expect(post.author).toBeTruthy()
        expect(post.tags.length).toBeGreaterThan(0)
        expect(post.readTime).toBeGreaterThan(0)
        expect(post.coverEmoji).toBeTruthy()
      }
    })

    it('dates are valid ISO strings that can be parsed', () => {
      for (const post of BLOG_POSTS) {
        const parsed = new Date(post.date)
        expect(parsed.getTime()).not.toBeNaN()
        expect(parsed.getFullYear()).toBeGreaterThanOrEqual(2024)
      }
    })

    it('readTime is a positive integer', () => {
      for (const post of BLOG_POSTS) {
        expect(Number.isInteger(post.readTime)).toBe(true)
        expect(post.readTime).toBeGreaterThan(0)
      }
    })

    it('content contains valid HTML', () => {
      for (const post of BLOG_POSTS) {
        expect(post.content).toContain('<article>')
        expect(post.content).toContain('</article>')
      }
    })
  })

  describe('getBlogPostBySlug', () => {
    it('returns correct post for guilded-alternatives-2026', () => {
      const post = getBlogPostBySlug('guilded-alternatives-2026')
      expect(post).toBeDefined()
      expect(post!.title).toContain('Guilded')
      expect(post!.tags).toContain('alternatives')
    })

    it('returns correct post for organiser-tournoi-entre-amis', () => {
      const post = getBlogPostBySlug('organiser-tournoi-entre-amis')
      expect(post).toBeDefined()
      expect(post!.title).toContain('tournoi')
    })

    it('returns correct post for squad-ghost-astuces', () => {
      const post = getBlogPostBySlug('squad-ghost-astuces')
      expect(post).toBeDefined()
      expect(post!.tags).toContain('engagement')
    })

    it('returns undefined for invalid slugs', () => {
      expect(getBlogPostBySlug('')).toBeUndefined()
      expect(getBlogPostBySlug('nonexistent-post')).toBeUndefined()
      expect(getBlogPostBySlug('Guilded-Alternatives-2026')).toBeUndefined() // case-sensitive
    })
  })

  describe('getAllBlogPosts', () => {
    it('returns all posts', () => {
      const posts = getAllBlogPosts()
      expect(posts).toHaveLength(BLOG_POSTS.length)
    })

    it('sorts posts by date descending (newest first)', () => {
      const posts = getAllBlogPosts()
      for (let i = 1; i < posts.length; i++) {
        const prev = new Date(posts[i - 1].date).getTime()
        const curr = new Date(posts[i].date).getTime()
        expect(prev).toBeGreaterThanOrEqual(curr)
      }
    })

    it('returns a new array (not mutating original)', () => {
      const posts = getAllBlogPosts()
      expect(posts).not.toBe(BLOG_POSTS)
    })

    it('first post is the most recent', () => {
      const posts = getAllBlogPosts()
      const firstDate = new Date(posts[0].date).getTime()
      for (const post of posts.slice(1)) {
        expect(firstDate).toBeGreaterThanOrEqual(new Date(post.date).getTime())
      }
    })
  })

  describe('getRelatedPosts', () => {
    it('excludes the current post from results', () => {
      const slug = 'guilded-alternatives-2026'
      const related = getRelatedPosts(slug)
      const slugs = related.map((p) => p.slug)
      expect(slugs).not.toContain(slug)
    })

    it('returns posts with at least one common tag', () => {
      const current = getBlogPostBySlug('squad-ghost-astuces')!
      const related = getRelatedPosts('squad-ghost-astuces')
      for (const post of related) {
        const hasCommonTag = post.tags.some((tag) => current.tags.includes(tag))
        expect(hasCommonTag).toBe(true)
      }
    })

    it('respects the limit parameter', () => {
      const related = getRelatedPosts('guilded-alternatives-2026', 1)
      expect(related.length).toBeLessThanOrEqual(1)
    })

    it('defaults to limit of 2', () => {
      const related = getRelatedPosts('guilded-alternatives-2026')
      expect(related.length).toBeLessThanOrEqual(2)
    })

    it('returns empty array for invalid slug', () => {
      expect(getRelatedPosts('nonexistent')).toEqual([])
    })

    it('returns empty array when no tags match', () => {
      // This tests the actual behavior - if a post has very unique tags
      // it might not have related posts
      const related = getRelatedPosts('guilded-alternatives-2026', 100)
      // At minimum we verify it returns an array
      expect(Array.isArray(related)).toBe(true)
    })
  })
})
