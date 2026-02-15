import { describe, it, expect, vi } from 'vitest'

// Mock remotion before any imports
vi.mock('remotion', () => ({
  Composition: ({ id }: { id: string }) => `Composition:${id}`,
  Folder: ({ name, children }: { name: string; children: React.ReactNode }) => children,
  registerRoot: vi.fn(),
}))

// Mock remotion google fonts
vi.mock('@remotion/google-fonts/SpaceGrotesk', () => ({
  loadFont: () => ({ fontFamily: 'Space Grotesk' }),
}))

vi.mock('@remotion/google-fonts/Inter', () => ({
  loadFont: () => ({ fontFamily: 'Inter' }),
}))

// Mock the HeroVideo component used by compositions
vi.mock('../../remotion/video1-hero/HeroVideo', () => ({
  HeroVideo: () => null,
}))

describe('remotion', () => {
  describe('shared/colors', () => {
    it('exports COLORS with expected structure', async () => {
      const { COLORS } = await import('../../remotion/shared/colors')
      expect(COLORS).toBeDefined()
      expect(COLORS.bg).toBeDefined()
      expect(COLORS.bg.base).toBe('#050506')
      expect(COLORS.primary).toBe('#6366f1')
      expect(COLORS.text).toBeDefined()
      expect(COLORS.text.primary).toBe('#fafafa')
      expect(COLORS.logo).toBeDefined()
      expect(COLORS.border).toBeDefined()
    })

    it('exports DISCORD_COLORS with expected structure', async () => {
      const { DISCORD_COLORS } = await import('../../remotion/shared/colors')
      expect(DISCORD_COLORS).toBeDefined()
      expect(DISCORD_COLORS.bg).toBe('#313338')
      expect(DISCORD_COLORS.text).toBe('#dbdee1')
      expect(Array.isArray(DISCORD_COLORS.avatarColors)).toBe(true)
      expect(DISCORD_COLORS.avatarColors.length).toBe(5)
    })
  })

  describe('shared/fonts', () => {
    it('exports FONTS with heading and body', async () => {
      const { FONTS } = await import('../../remotion/shared/fonts')
      expect(FONTS).toBeDefined()
      expect(FONTS.heading).toBeDefined()
      expect(FONTS.body).toBeDefined()
    })
  })

  describe('compositions', () => {
    it('exports RemotionRoot component', async () => {
      const { RemotionRoot } = await import('../../remotion/compositions')
      expect(RemotionRoot).toBeDefined()
      expect(typeof RemotionRoot).toBe('function')
    })
  })

  describe('index', () => {
    it('calls registerRoot', async () => {
      const remotion = await import('remotion')
      // Re-import index to trigger registerRoot call
      await import('../../remotion/index')
      expect(remotion.registerRoot).toHaveBeenCalled()
    })
  })
})
