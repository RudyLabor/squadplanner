import { describe, it, expect } from 'vitest'
import routeConfig from '../routes'

describe('routes configuration', () => {
  // Flatten all routes including nested ones
  function getAllPaths(routes: any[]): string[] {
    const paths: string[] = []
    for (const route of routes) {
      if (route.path) paths.push(route.path)
      if (route.children) paths.push(...getAllPaths(route.children))
    }
    return paths
  }

  it('exports a non-empty route configuration', () => {
    expect(routeConfig).toBeDefined()
    expect(Array.isArray(routeConfig)).toBe(true)
    expect(routeConfig.length).toBeGreaterThan(0)
  })

  it('has an index route', () => {
    const hasIndex = routeConfig.some((r: any) => r.index === true)
    expect(hasIndex).toBe(true)
  })

  it('includes public routes', () => {
    const paths = getAllPaths(routeConfig)
    expect(paths).toContain('auth')
    expect(paths).toContain('legal')
    expect(paths).toContain('help')
    expect(paths).toContain('premium')
    expect(paths).toContain('maintenance')
  })

  it('includes SEO game routes', () => {
    const paths = getAllPaths(routeConfig)
    expect(paths).toContain('games/:game')
    expect(paths).toContain('lfg/:game')
  })

  it('includes alternative/comparison pages', () => {
    const paths = getAllPaths(routeConfig)
    expect(paths).toContain('alternative/guilded')
    expect(paths).toContain('alternative/gamerlink')
    expect(paths).toContain('alternative/discord-events')
    expect(paths).toContain('vs/guilded-vs-squad-planner')
  })

  it('includes blog routes', () => {
    const paths = getAllPaths(routeConfig)
    expect(paths).toContain('blog')
    expect(paths).toContain('blog/:slug')
  })

  it('includes protected routes under layout', () => {
    const protectedLayout = routeConfig.find((r: any) => r.children && r.children.length > 10)
    expect(protectedLayout).toBeDefined()

    const protectedPaths = getAllPaths(protectedLayout.children)
    expect(protectedPaths).toContain('home')
    expect(protectedPaths).toContain('squads')
    expect(protectedPaths).toContain('squad/:id')
    expect(protectedPaths).toContain('sessions')
    expect(protectedPaths).toContain('messages')
    expect(protectedPaths).toContain('party')
    expect(protectedPaths).toContain('discover')
    expect(protectedPaths).toContain('profile')
    expect(protectedPaths).toContain('settings')
    expect(protectedPaths).toContain('call-history')
    expect(protectedPaths).toContain('referrals')
    expect(protectedPaths).toContain('wrapped')
  })

  it('includes join and share routes with dynamic params', () => {
    const paths = getAllPaths(routeConfig)
    expect(paths).toContain('join/:code')
    expect(paths).toContain('s/:id')
  })

  it('has a catch-all 404 route', () => {
    const catchAll = routeConfig.find((r: any) => r.path === '*')
    expect(catchAll).toBeDefined()
  })

  it('includes sitemap route', () => {
    const paths = getAllPaths(routeConfig)
    expect(paths).toContain('sitemap.xml')
  })

  it('includes widget route', () => {
    const paths = getAllPaths(routeConfig)
    expect(paths).toContain('widget/:squadId')
  })

  it('includes ambassador route', () => {
    const paths = getAllPaths(routeConfig)
    expect(paths).toContain('ambassador')
  })

  it('includes onboarding route', () => {
    const paths = getAllPaths(routeConfig)
    expect(paths).toContain('onboarding')
  })

  it('has no duplicate paths', () => {
    const paths = getAllPaths(routeConfig)
    const duplicates = paths.filter((p, i) => paths.indexOf(p) !== i)
    expect(duplicates).toEqual([])
  })

  it('all route files reference .tsx files', () => {
    function getAllFiles(routes: any[]): string[] {
      const files: string[] = []
      for (const route of routes) {
        if (route.file) files.push(route.file)
        if (route.children) files.push(...getAllFiles(route.children))
      }
      return files
    }
    const files = getAllFiles(routeConfig)
    for (const file of files) {
      expect(file).toMatch(/\.tsx$/)
    }
  })
})
