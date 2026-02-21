import { describe, it, expect } from 'vitest'
import {
  parseDeepLinkUrl,
  isValidDeepLinkPath,
  DEEP_LINK_PREFIXES,
} from '../deepLinkParsing'

describe('parseDeepLinkUrl', () => {
  describe('universal links (https://squadplanner.fr)', () => {
    it('parses /join/ path', () => {
      expect(parseDeepLinkUrl('https://squadplanner.fr/join/abc123')).toBe('/join/abc123')
    })

    it('parses /s/ path', () => {
      expect(parseDeepLinkUrl('https://squadplanner.fr/s/session-id')).toBe('/s/session-id')
    })

    it('parses path with query string', () => {
      expect(parseDeepLinkUrl('https://squadplanner.fr/join/abc?ref=discord')).toBe(
        '/join/abc?ref=discord'
      )
    })

    it('returns root path for base URL', () => {
      expect(parseDeepLinkUrl('https://squadplanner.fr/')).toBe('/')
    })

    it('rejects other hostnames', () => {
      expect(parseDeepLinkUrl('https://example.com/join/abc')).toBeNull()
      expect(parseDeepLinkUrl('https://squadplanner.com/join/abc')).toBeNull()
    })
  })

  describe('custom scheme (squadplanner://)', () => {
    it('parses squadplanner://app/join/abc', () => {
      expect(parseDeepLinkUrl('squadplanner://app/join/abc')).toBe('/join/abc')
    })

    it('parses squadplanner://app/s/session-id', () => {
      expect(parseDeepLinkUrl('squadplanner://app/s/session-id')).toBe('/s/session-id')
    })

    it('parses with query string', () => {
      expect(parseDeepLinkUrl('squadplanner://app/u/player?tab=stats')).toBe(
        '/u/player?tab=stats'
      )
    })
  })

  describe('invalid inputs', () => {
    it('returns null for empty string', () => {
      expect(parseDeepLinkUrl('')).toBeNull()
    })

    it('returns null for invalid URL', () => {
      expect(parseDeepLinkUrl('not-a-url')).toBeNull()
    })

    it('returns null for relative path', () => {
      expect(parseDeepLinkUrl('/join/abc')).toBeNull()
    })
  })
})

describe('isValidDeepLinkPath', () => {
  it('accepts /join/ paths', () => {
    expect(isValidDeepLinkPath('/join/abc123')).toBe(true)
  })

  it('accepts /s/ paths', () => {
    expect(isValidDeepLinkPath('/s/session-id')).toBe(true)
  })

  it('accepts /squad/ paths', () => {
    expect(isValidDeepLinkPath('/squad/my-squad')).toBe(true)
  })

  it('accepts /u/ paths', () => {
    expect(isValidDeepLinkPath('/u/player-name')).toBe(true)
  })

  it('accepts /referral/ paths', () => {
    expect(isValidDeepLinkPath('/referral/code123')).toBe(true)
  })

  it('rejects paths not in DEEP_LINK_PREFIXES', () => {
    expect(isValidDeepLinkPath('/settings')).toBe(false)
    expect(isValidDeepLinkPath('/auth')).toBe(false)
    expect(isValidDeepLinkPath('/')).toBe(false)
    expect(isValidDeepLinkPath('/blog/post-slug')).toBe(false)
  })

  it('rejects prefix without trailing slash', () => {
    // /join (no trailing slash) should not match /join/
    expect(isValidDeepLinkPath('/join')).toBe(false)
  })
})

describe('DEEP_LINK_PREFIXES', () => {
  it('contains exactly 5 prefixes', () => {
    expect(DEEP_LINK_PREFIXES).toHaveLength(5)
  })

  it('all prefixes start and end with /', () => {
    for (const prefix of DEEP_LINK_PREFIXES) {
      expect(prefix).toMatch(/^\/.*\/$/)
    }
  })

  it('covers join, session, squad, user, and referral routes', () => {
    expect(DEEP_LINK_PREFIXES).toContain('/join/')
    expect(DEEP_LINK_PREFIXES).toContain('/s/')
    expect(DEEP_LINK_PREFIXES).toContain('/squad/')
    expect(DEEP_LINK_PREFIXES).toContain('/u/')
    expect(DEEP_LINK_PREFIXES).toContain('/referral/')
  })
})
