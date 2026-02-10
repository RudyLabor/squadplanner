import { describe, it, expect, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import {
  useNotificationBannerStore,
  showAchievementBanner,
  showUpdateBanner,
  showInfoBanner,
} from '../useNotificationBanner'

describe('useNotificationBannerStore', () => {
  beforeEach(() => {
    act(() => {
      useNotificationBannerStore.getState().dismissAll()
    })
  })

  it('starts with empty banners array', () => {
    expect(useNotificationBannerStore.getState().banners).toEqual([])
  })

  it('showBanner adds a banner and returns an id', () => {
    let id: string
    act(() => {
      id = useNotificationBannerStore.getState().showBanner({
        type: 'info',
        title: 'Test Banner',
      })
    })
    expect(id!).toBeDefined()
    expect(id!).toMatch(/^banner-\d+$/)
    expect(useNotificationBannerStore.getState().banners).toHaveLength(1)
    expect(useNotificationBannerStore.getState().banners[0].title).toBe('Test Banner')
  })

  it('showBanner sets defaults (dismissible: true, persistent: false, duration: 8000)', () => {
    act(() => {
      useNotificationBannerStore.getState().showBanner({
        type: 'info',
        title: 'Default Test',
      })
    })
    const banner = useNotificationBannerStore.getState().banners[0]
    expect(banner.dismissible).toBe(true)
    expect(banner.persistent).toBe(false)
    expect(banner.duration).toBe(8000)
  })

  it('dismissBanner removes specific banner by id', () => {
    let id1: string
    let id2: string
    act(() => {
      id1 = useNotificationBannerStore.getState().showBanner({
        type: 'info',
        title: 'Banner 1',
      })
      id2 = useNotificationBannerStore.getState().showBanner({
        type: 'success',
        title: 'Banner 2',
      })
    })
    expect(useNotificationBannerStore.getState().banners).toHaveLength(2)

    act(() => {
      useNotificationBannerStore.getState().dismissBanner(id1!)
    })
    const remaining = useNotificationBannerStore.getState().banners
    expect(remaining).toHaveLength(1)
    expect(remaining[0].id).toBe(id2!)
    expect(remaining[0].title).toBe('Banner 2')
  })

  it('dismissAll clears all banners', () => {
    act(() => {
      useNotificationBannerStore.getState().showBanner({ type: 'info', title: 'A' })
      useNotificationBannerStore.getState().showBanner({ type: 'success', title: 'B' })
      useNotificationBannerStore.getState().showBanner({ type: 'warning', title: 'C' })
    })
    expect(useNotificationBannerStore.getState().banners).toHaveLength(3)

    act(() => {
      useNotificationBannerStore.getState().dismissAll()
    })
    expect(useNotificationBannerStore.getState().banners).toEqual([])
  })

  it('showAchievementBanner helper creates achievement banner with duration 6000', () => {
    act(() => {
      showAchievementBanner('Level Up!', 'You reached level 5')
    })
    const banner = useNotificationBannerStore.getState().banners[0]
    expect(banner.type).toBe('achievement')
    expect(banner.title).toBe('Level Up!')
    expect(banner.message).toBe('You reached level 5')
    expect(banner.duration).toBe(6000)
  })

  it('showInfoBanner helper creates info banner', () => {
    act(() => {
      showInfoBanner('Server maintenance', 'Tomorrow at 3am')
    })
    const banner = useNotificationBannerStore.getState().banners[0]
    expect(banner.type).toBe('info')
    expect(banner.title).toBe('Server maintenance')
    expect(banner.message).toBe('Tomorrow at 3am')
    expect(banner.duration).toBe(8000)
  })

  it('showUpdateBanner helper creates persistent update banner with action', () => {
    const onUpdate = () => {}
    act(() => {
      showUpdateBanner('New version available', onUpdate)
    })
    const banner = useNotificationBannerStore.getState().banners[0]
    expect(banner.type).toBe('update')
    expect(banner.title).toBe('New version available')
    expect(banner.persistent).toBe(true)
    expect(banner.actions).toHaveLength(1)
    expect(banner.actions![0].label).toBe('Mettre a jour')
    expect(banner.actions![0].variant).toBe('primary')
  })

  it('multiple banners can coexist', () => {
    act(() => {
      useNotificationBannerStore.getState().showBanner({ type: 'info', title: 'First' })
      useNotificationBannerStore.getState().showBanner({ type: 'success', title: 'Second' })
      useNotificationBannerStore.getState().showBanner({ type: 'warning', title: 'Third' })
    })
    const banners = useNotificationBannerStore.getState().banners
    expect(banners).toHaveLength(3)
    expect(banners[0].title).toBe('First')
    expect(banners[1].title).toBe('Second')
    expect(banners[2].title).toBe('Third')
    // Each has a unique id
    const ids = new Set(banners.map((b) => b.id))
    expect(ids.size).toBe(3)
  })
})
