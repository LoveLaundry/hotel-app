import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import './feature-pack.css'
import { useLocation, useNavigate } from 'react-router-dom'
import { authApi } from '../../api/client'
import { appConfig } from '../../config/app'
import { readSession } from '../../session'
import {
  FeatureContext,
  type ConfirmRequest,
  type FeatureContextValue,
  type LastSignIn,
  type PortalNotification,
  type Toast,
  type ToastTone,
} from './context'
import {
  BackToTop,
  CommandPalette,
  ConfirmDialog,
  NotificationBell,
  OfflineBanner,
  portalCommands,
  RouteProgress,
  SessionExpiryBanner,
  ShortcutHelpDialog,
  SkipLink,
  ToastStack,
  localNavigationLabel,
} from './components'
import { FeatureGuide } from './FeaturePanel'
import { useActionQueue, useLocalStorageState, useOnlineStatus, usePrefersReducedMotion, useSessionWarning } from './hooks'
import { clearFeatureCache, normalizeError, readJson, STORAGE_KEYS, writeJsonStrict } from './utils'

function expiryFromToken(token: string | undefined): number | null {
  if (!token) return null
  try {
    const segment = token.split('.')[1]
    if (!segment) return null
    const payload = JSON.parse(atob(segment)) as { exp?: number }
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null
  } catch {
    return null
  }
}

function newId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return `${prefix}-${crypto.randomUUID()}`
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function isTypingTarget(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null
  return Boolean(element && (/^(INPUT|TEXTAREA|SELECT)$/.test(element.tagName) || element.isContentEditable))
}

/** Global UI state for the hotel portal. No branding, tokens or cross-app state. */
export function FeatureProvider({ children }: { children: ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [featuresOpen, setFeaturesOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [liveMessage, setLiveMessage] = useState('')
  const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest | null>(null)
  const [expiresAt, setExpiresAt] = useState<number | null>(() => expiryFromToken(readSession()?.token))
  const [lastSignIn, setLastSignIn] = useState<LastSignIn | null>(() => readJson<LastSignIn | null>(STORAGE_KEYS.lastSignIn, null))
  const [notifications, setNotifications] = useState<PortalNotification[]>(() =>
    readJson<PortalNotification[]>(STORAGE_KEYS.notifications, []),
  )
  const [highContrast, setHighContrast] = useLocalStorageState(STORAGE_KEYS.highContrast, false)
  const [largeText, setLargeText] = useLocalStorageState(STORAGE_KEYS.largeText, false)
  const [reducedMotion, setReducedMotionPreference] = usePrefersReducedMotion()
  const [progressActive, setProgressActive] = useState(false)
  const online = useOnlineStatus()
  const { queued, enqueue, clear: clearQueue } = useActionQueue(online)
  const sessionWarning = useSessionWarning(expiresAt)
  const toastTimers = useRef<number[]>([])

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const notify = useCallback(
    (message: string, tone: ToastTone = 'success') => {
      const id = newId('toast')
      setToasts((current) => [...current.slice(-3), { id, message, tone }])
      setLiveMessage(message)
      const timer = window.setTimeout(() => dismissToast(id), 4200)
      toastTimers.current.push(timer)
    },
    [dismissToast],
  )

  const announce = useCallback((message: string) => setLiveMessage(message), [])

  /** Apply locally first, persist immediately, roll back if storage rejects it. */
  const updateNotifications = useCallback((updater: (current: PortalNotification[]) => PortalNotification[]) => {
    setNotifications((current) => {
      const next = updater(current)
      try {
        writeJsonStrict(STORAGE_KEYS.notifications, next)
        return next
      } catch {
        return current
      }
    })
  }, [])

  const pushNotification = useCallback(
    ({ title, body }: { title: string; body: string }) => {
      updateNotifications((current) =>
        [{ id: newId('note'), title, body, at: new Date().toISOString(), read: false }, ...current].slice(0, 20),
      )
    },
    [updateNotifications],
  )

  const markRead = useCallback(
    (id: string) => updateNotifications((current) => current.map((item) => (item.id === id ? { ...item, read: true } : item))),
    [updateNotifications],
  )
  const markAllRead = useCallback(
    () => updateNotifications((current) => current.map((item) => ({ ...item, read: true }))),
    [updateNotifications],
  )
  const unreadCount = notifications.filter((item) => !item.read).length

  const refreshLastSignIn = useCallback(() => {
    setLastSignIn(readJson<LastSignIn | null>(STORAGE_KEYS.lastSignIn, null))
  }, [])

  const clearPortalState = useCallback(() => {
    clearFeatureCache()
    clearQueue()
    setNotifications([])
    try {
      writeJsonStrict(STORAGE_KEYS.notifications, [])
    } catch {
      /* In-memory state is still cleared. */
    }
    setLastSignIn(null)
    setExpiresAt(null)
    try {
      Object.keys(localStorage)
        .filter((key) => key.startsWith(STORAGE_KEYS.draftPrefix))
        .forEach((key) => localStorage.removeItem(key))
    } catch {
      /* Storage may be unavailable; the in-memory state is still cleared. */
    }
    window.dispatchEvent(new Event('ll_hotel:force-signout'))
    navigate('/login', { replace: true })
    notify('Signed out. Local portal data cleared.')
  }, [clearQueue, navigate, notify, setNotifications])

  const requestConfirm = useCallback((request: ConfirmRequest) => setConfirmRequest(request), [])
  const closeConfirm = useCallback(() => setConfirmRequest(null), [])

  /* Persisted appearance preferences are applied to the document root. */
  useEffect(() => {
    const root = document.documentElement
    root.dataset.contrast = highContrast ? 'high' : 'normal'
    root.dataset.textScale = largeText ? 'large' : 'normal'
    root.dataset.reducedMotion = reducedMotion ? 'reduce' : 'auto'
  }, [highContrast, largeText, reducedMotion])

  /* Route title, progress, announcements and overlay dismissal. */
  useEffect(() => {
    const label = localNavigationLabel(location.pathname)
    document.title = `${label} · ${appConfig.title}`
    announce(`${label} page loaded`)
    setPaletteOpen(false)
    setFeaturesOpen(false)
    setNotificationsOpen(false)
    setProgressActive(true)
    const timer = window.setTimeout(() => setProgressActive(false), reducedMotion ? 0 : 520)
    return () => window.clearTimeout(timer)
  }, [location.pathname, announce, reducedMotion])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setPaletteOpen((open) => !open)
        return
      }
      if (event.key === '?' && !isTypingTarget(event.target)) {
        event.preventDefault()
        setShortcutsOpen(true)
      }
    }
    const onShortcuts = () => setShortcutsOpen(true)
    const onNotification = (event: Event) => {
      const detail = (event as CustomEvent<{ title: string; body: string }>).detail
      if (detail?.title) pushNotification(detail)
    }
    const onUnauthorized = () => {
      clearFeatureCache()
      setExpiresAt(null)
      pushNotification({ title: 'Session ended', body: 'Your session expired. Sign in again to continue.' })
    }
    const onSession = (event: Event) => {
      const detail = (event as CustomEvent<{ token?: string }>).detail
      setExpiresAt(expiryFromToken(detail?.token ?? readSession()?.token))
      refreshLastSignIn()
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('ll_hotel:shortcuts', onShortcuts)
    window.addEventListener('ll_hotel:notification', onNotification)
    window.addEventListener('ll_hotel:unauthorized', onUnauthorized)
    window.addEventListener('ll_hotel:session', onSession)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('ll_hotel:shortcuts', onShortcuts)
      window.removeEventListener('ll_hotel:notification', onNotification)
      window.removeEventListener('ll_hotel:unauthorized', onUnauthorized)
      window.removeEventListener('ll_hotel:session', onSession)
    }
  }, [pushNotification, refreshLastSignIn])

  useEffect(() => {
    if (!online) return
    if (queued.length === 0) return
    pushNotification({ title: 'Back online', body: `${queued.length} queued portal action${queued.length === 1 ? '' : 's'} replayed.` })
  }, [online, queued.length, pushNotification])

  useEffect(() => {
    if (!online) return
    if (expiresAt === null) return
    if (expiresAt > Date.now() + 180_000) return
    // A background check keeps the warning honest without forcing a sign-out.
    let cancelled = false
    void authApi
      .get(appConfig.statusPath)
      .then(() => {
        if (!cancelled) setExpiresAt(expiryFromToken(readSession()?.token))
      })
      .catch((error: unknown) => {
        if (!cancelled) notify(normalizeError(error), 'error')
      })
    return () => {
      cancelled = true
    }
  }, [expiresAt, online, notify])

  useEffect(
    () => () => {
      toastTimers.current.forEach((timer) => window.clearTimeout(timer))
    },
    [],
  )

  const checkSession = useCallback(() => {
    void authApi
      .get(appConfig.statusPath)
      .then(() => notify('Session is still active.'))
      .catch((error: unknown) => notify(normalizeError(error), 'error'))
  }, [notify])

  const commands = useMemo(
    () =>
      portalCommands(
        () => window.dispatchEvent(new Event('ll_hotel:refresh')),
        clearPortalState,
      ),
    [clearPortalState],
  )

  const value = useMemo<FeatureContextValue>(
    () => ({
      paletteOpen,
      setPaletteOpen,
      shortcutsOpen,
      setShortcutsOpen,
      featuresOpen,
      setFeaturesOpen,
      notificationsOpen,
      setNotificationsOpen,
      toasts,
      notify,
      dismissToast,
      announce,
      liveMessage,
      highContrast,
      toggleHighContrast: () => setHighContrast((current) => !current),
      largeText,
      toggleLargeText: () => setLargeText((current) => !current),
      reducedMotion,
      toggleReducedMotion: () => setReducedMotionPreference(!reducedMotion),
      online,
      queued,
      enqueueRefresh: enqueue,
      clearQueue,
      notifications,
      unreadCount,
      pushNotification,
      markRead,
      markAllRead,
      expiresAt,
      setSessionExpiry: setExpiresAt,
      sessionWarning,
      lastSignIn,
      refreshLastSignIn,
      confirmRequest,
      requestConfirm,
      closeConfirm,
      clearPortalState,
    }),
    [
      paletteOpen,
      shortcutsOpen,
      featuresOpen,
      notificationsOpen,
      toasts,
      notify,
      dismissToast,
      announce,
      liveMessage,
      highContrast,
      setHighContrast,
      largeText,
      setLargeText,
      reducedMotion,
      setReducedMotionPreference,
      online,
      queued,
      enqueue,
      clearQueue,
      notifications,
      unreadCount,
      pushNotification,
      markRead,
      markAllRead,
      expiresAt,
      sessionWarning,
      lastSignIn,
      refreshLastSignIn,
      confirmRequest,
      requestConfirm,
      closeConfirm,
      clearPortalState,
    ],
  )

  return (
    <FeatureContext.Provider value={value}>
      <SkipLink />
      <RouteProgress active={progressActive} />
      <OfflineBanner />
      <SessionExpiryBanner onRefresh={checkSession} onSignOut={clearPortalState} />
      {children}
      <BackToTop />
      <NotificationBell />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} commands={commands} />
      <ShortcutHelpDialog />
      {featuresOpen ? <FeatureGuide variant="dialog" onClose={() => setFeaturesOpen(false)} /> : null}
      <ConfirmDialog />
      <ToastStack />
      <div className="sr-only" role="status" aria-live="polite">
        {liveMessage}
      </div>
    </FeatureContext.Provider>
  )
}
