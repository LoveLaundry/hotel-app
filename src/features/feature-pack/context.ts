import { createContext, useContext } from 'react'
import type { QueuedAction } from './hooks'

export type ToastTone = 'success' | 'info' | 'error'

export interface Toast {
  id: string
  message: string
  tone: ToastTone
}

export interface PortalNotification {
  id: string
  title: string
  body: string
  at: string
  read: boolean
}

export interface ConfirmRequest {
  title: string
  body: string
  confirmLabel?: string
  tone?: 'danger' | 'default'
  onConfirm: () => void
}

export interface LastSignIn {
  at: string
  name: string
}

export interface FeatureContextValue {
  paletteOpen: boolean
  setPaletteOpen: (open: boolean) => void
  shortcutsOpen: boolean
  setShortcutsOpen: (open: boolean) => void
  featuresOpen: boolean
  setFeaturesOpen: (open: boolean) => void
  notificationsOpen: boolean
  setNotificationsOpen: (open: boolean) => void
  toasts: Toast[]
  notify: (message: string, tone?: ToastTone) => void
  dismissToast: (id: string) => void
  announce: (message: string) => void
  liveMessage: string
  highContrast: boolean
  toggleHighContrast: () => void
  largeText: boolean
  toggleLargeText: () => void
  reducedMotion: boolean
  toggleReducedMotion: () => void
  online: boolean
  queued: QueuedAction[]
  enqueueRefresh: (action: QueuedAction) => void
  clearQueue: () => void
  notifications: PortalNotification[]
  unreadCount: number
  pushNotification: (input: { title: string; body: string }) => void
  markRead: (id: string) => void
  markAllRead: () => void
  expiresAt: number | null
  setSessionExpiry: (value: number | null) => void
  sessionWarning: boolean
  lastSignIn: LastSignIn | null
  refreshLastSignIn: () => void
  confirmRequest: ConfirmRequest | null
  requestConfirm: (request: ConfirmRequest) => void
  closeConfirm: () => void
  clearPortalState: () => void
}

export const FeatureContext = createContext<FeatureContextValue | null>(null)

/** Shared UI state; kept in its own module so overlays don't import the provider. */
export function useFeatures(): FeatureContextValue {
  const context = useContext(FeatureContext)
  if (!context) throw new Error('useFeatures must be used inside FeatureProvider')
  return context
}
