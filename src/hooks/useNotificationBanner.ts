import { create } from 'zustand'
import type { ElementType } from 'react'

export type BannerType = 'info' | 'success' | 'warning' | 'achievement' | 'update'

export interface BannerAction {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
}

export interface NotificationBanner {
  id: string
  type: BannerType
  title: string
  message?: string
  icon?: ElementType
  actions?: BannerAction[]
  dismissible?: boolean
  persistent?: boolean
  duration?: number
}

interface NotificationBannerState {
  banners: NotificationBanner[]
  showBanner: (banner: Omit<NotificationBanner, 'id'>) => string
  dismissBanner: (id: string) => void
  dismissAll: () => void
}

let bannerId = 0

export const useNotificationBannerStore = create<NotificationBannerState>((set) => ({
  banners: [],
  showBanner: (banner) => {
    const id = `banner-${++bannerId}`
    set((state) => ({
      banners: [
        ...state.banners,
        {
          ...banner,
          id,
          dismissible: banner.dismissible ?? true,
          persistent: banner.persistent ?? false,
          duration: banner.duration ?? 8000,
        },
      ],
    }))
    return id
  },
  dismissBanner: (id) => {
    set((state) => ({
      banners: state.banners.filter((b) => b.id !== id),
    }))
  },
  dismissAll: () => {
    set({ banners: [] })
  },
}))

// Convenience helpers
export const showAchievementBanner = (title: string, message?: string) =>
  useNotificationBannerStore.getState().showBanner({
    type: 'achievement',
    title,
    message,
    duration: 6000,
  })

export const showUpdateBanner = (title: string, onUpdate: () => void) =>
  useNotificationBannerStore.getState().showBanner({
    type: 'update',
    title,
    persistent: true,
    actions: [{ label: 'Mettre à jour', onClick: onUpdate, variant: 'primary' }],
  })

export const showInfoBanner = (title: string, message?: string) =>
  useNotificationBannerStore.getState().showBanner({
    type: 'info',
    title,
    message,
  })
