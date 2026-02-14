import { describe, it, expect, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import { useOverlayStore } from '../useOverlayStore'

describe('useOverlayStore', () => {
  beforeEach(() => {
    act(() => {
      useOverlayStore.setState({ activeOverlay: null })
    })
  })

  it('initial state is null', () => {
    const { activeOverlay } = useOverlayStore.getState()
    expect(activeOverlay).toBeNull()
  })

  it('open sets activeOverlay', () => {
    act(() => {
      useOverlayStore.getState().open('notifications')
    })
    expect(useOverlayStore.getState().activeOverlay).toBe('notifications')
  })

  it('close with no args sets activeOverlay to null', () => {
    act(() => {
      useOverlayStore.getState().open('notifications')
    })
    expect(useOverlayStore.getState().activeOverlay).toBe('notifications')

    act(() => {
      useOverlayStore.getState().close()
    })
    expect(useOverlayStore.getState().activeOverlay).toBeNull()
  })

  it('close with matching id sets activeOverlay to null', () => {
    act(() => {
      useOverlayStore.getState().open('more-menu')
    })
    expect(useOverlayStore.getState().activeOverlay).toBe('more-menu')

    act(() => {
      useOverlayStore.getState().close('more-menu')
    })
    expect(useOverlayStore.getState().activeOverlay).toBeNull()
  })

  it('close with non-matching id does nothing', () => {
    act(() => {
      useOverlayStore.getState().open('notifications')
    })
    expect(useOverlayStore.getState().activeOverlay).toBe('notifications')

    act(() => {
      useOverlayStore.getState().close('more-menu')
    })
    expect(useOverlayStore.getState().activeOverlay).toBe('notifications')
  })

  it('toggle opens when closed', () => {
    expect(useOverlayStore.getState().activeOverlay).toBeNull()

    act(() => {
      useOverlayStore.getState().toggle('notifications')
    })
    expect(useOverlayStore.getState().activeOverlay).toBe('notifications')
  })

  it('toggle closes when same id is open', () => {
    act(() => {
      useOverlayStore.getState().open('notifications')
    })
    expect(useOverlayStore.getState().activeOverlay).toBe('notifications')

    act(() => {
      useOverlayStore.getState().toggle('notifications')
    })
    expect(useOverlayStore.getState().activeOverlay).toBeNull()
  })

  it('toggle switches to different overlay when another is open', () => {
    act(() => {
      useOverlayStore.getState().open('notifications')
    })
    expect(useOverlayStore.getState().activeOverlay).toBe('notifications')

    act(() => {
      useOverlayStore.getState().toggle('more-menu')
    })
    expect(useOverlayStore.getState().activeOverlay).toBe('more-menu')
  })
})
