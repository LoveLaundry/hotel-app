import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import {
  dedupeById,
  hasErrors,
  readJson,
  removeKey,
  STORAGE_KEYS,
  validateCredentials,
  writeJson,
  type CredentialsInput,
  type FieldErrors,
  type SortDirection,
} from './utils'

/** Keep expensive filtering off every keystroke. */
export function useDebouncedValue<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(timer)
  }, [value, delay])
  return debounced
}

export function useLocalStorageState<T>(key: string, initial: T): [T, (value: T | ((current: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => readJson<T>(key, initial))
  const update = useCallback(
    (next: T | ((current: T) => T)) => {
      setValue((current) => {
        const resolved = typeof next === 'function' ? (next as (c: T) => T)(current) : next
        writeJson(key, resolved)
        return resolved
      })
    },
    [key],
  )
  return [value, update]
}

export function usePrefersReducedMotion(): [boolean, (value: boolean | null) => void] {
  const manual = useLocalStorageState<boolean | null>(STORAGE_KEYS.reducedMotion, null)
  const [systemPrefers, setSystemPrefers] = useState(() =>
    typeof window !== 'undefined' && 'matchMedia' in window
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  )
  useEffect(() => {
    if (typeof window === 'undefined' || !('matchMedia' in window)) return
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setSystemPrefers(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return [manual[0] ?? systemPrefers, manual[1]]
}

/** Adds a shadow class only after the sticky header has actually moved. */
export function useScrolled(threshold = 8): boolean {
  const [scrolled, setScrolled] = useState(() => typeof window !== 'undefined' && window.scrollY > threshold)
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > threshold)
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [threshold])
  return scrolled
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Trap Tab inside a drawer/dialog and return focus to the opener on unmount.
 * Works with React 19 refs and does not require a portal implementation.
 */
export function useFocusTrap<T extends HTMLElement>(active: boolean): RefObject<T | null> {
  const ref = useRef<T | null>(null)
  useEffect(() => {
    if (!active) return
    const opener = document.activeElement as HTMLElement | null
    const node = ref.current
    if (!node) return
    const first = node.querySelector<HTMLElement>(FOCUSABLE)
    ;(first ?? node).focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      const focusable = [...node.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (element) => element.offsetParent !== null || element === document.activeElement,
      )
      if (focusable.length === 0) {
        event.preventDefault()
        return
      }
      const firstItem = focusable[0]
      const lastItem = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault()
        lastItem.focus()
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault()
        firstItem.focus()
      }
    }
    node.addEventListener('keydown', onKeyDown)
    return () => {
      node.removeEventListener('keydown', onKeyDown)
      opener?.focus?.()
    }
  }, [active])
  return ref
}

export function useEscape(active: boolean, onEscape: () => void): void {
  const handler = useRef(onEscape)
  handler.current = onEscape
  useEffect(() => {
    if (!active) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        handler.current()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [active])
}

export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine))
  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])
  return online
}

export interface DraftState {
  value: string
  setValue: (value: string) => void
  restored: boolean
  restore: () => void
  discard: () => void
  status: 'idle' | 'saving' | 'saved' | 'unavailable'
  clear: () => void
}

/** Autosaves non-sensitive fields only. Callers decide what is safe to persist. */
export function useDraft(name: string, initial = ''): DraftState {
  const key = `${STORAGE_KEYS.draftPrefix}${name}`
  const [value, setValueState] = useState(initial)
  const [restored, setRestored] = useState(false)
  const [status, setStatus] = useState<DraftState['status']>('idle')
  const saved = useRef<string | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(key)
      if (stored) {
        saved.current = stored
        setRestored(true)
      }
    } catch {
      setStatus('unavailable')
    }
  }, [key])

  useEffect(() => {
    if (value === initial && saved.current === null) return
    setStatus('saving')
    const timer = window.setTimeout(() => {
      try {
        if (value) localStorage.setItem(key, value)
        else localStorage.removeItem(key)
        saved.current = value || null
        setStatus('saved')
      } catch {
        setStatus('unavailable')
      }
    }, 500)
    return () => window.clearTimeout(timer)
  }, [value, initial, key])

  const setValue = useCallback((next: string) => setValueState(next), [])
  const restore = useCallback(() => {
    if (saved.current !== null) setValueState(saved.current)
    setRestored(false)
  }, [])
  const discard = useCallback(() => {
    saved.current = null
    removeKey(key)
    setValueState('')
    setRestored(false)
    setStatus('idle')
  }, [key])
  const clear = useCallback(() => {
    saved.current = null
    removeKey(key)
    setStatus('idle')
  }, [key])

  return { value, setValue, restored, restore, discard, status, clear }
}

/** Blocks a second write while the first is still in flight. */
export function useSubmitOnce<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>,
): { run: (...args: TArgs) => Promise<TResult | null>; pending: boolean } {
  const inFlight = useRef(false)
  const [pending, setPending] = useState(false)
  const run = useCallback(
    async (...args: TArgs) => {
      if (inFlight.current) return null
      inFlight.current = true
      setPending(true)
      try {
        return await action(...args)
      } finally {
        inFlight.current = false
        setPending(false)
      }
    },
    [action],
  )
  return { run, pending }
}

/** Deduplicates rapid queue entries by their stable key. */
export function dedupeByKey<T>(items: T[], keyOf: (item: T) => string): T[] {
  return dedupeById(items, keyOf)
}

type CredentialField = 'username' | 'password'

/** Blur-time validation with a visible summary after a submit attempt. */
export function useFieldValidation(mode: 'signin' | 'check' = 'signin'): {
  errors: FieldErrors
  touched: Partial<Record<CredentialField, boolean>>
  validateField: (field: CredentialField, input: CredentialsInput) => void
  validateAll: (input: CredentialsInput) => boolean
  markTouched: (field: CredentialField) => void
  reset: () => void
  summaryErrors: Record<string, string | undefined>
} {
  const [errors, setErrors] = useState<FieldErrors>({})
  const [touched, setTouched] = useState<Partial<Record<CredentialField, boolean>>>({})
  const [attempted, setAttempted] = useState(false)

  const validateField = useCallback(
    (field: CredentialField, input: CredentialsInput) => {
      const next = validateCredentials(input, mode)
      setErrors((current) => ({ ...current, [field]: next[field] }))
    },
    [mode],
  )

  const validateAll = useCallback(
    (input: CredentialsInput) => {
      const next = validateCredentials(input, mode)
      setErrors(next)
      setAttempted(true)
      return !hasErrors(next)
    },
    [mode],
  )

  const markTouched = useCallback((field: CredentialField) => {
    setTouched((current) => ({ ...current, [field]: true }))
  }, [])

  const reset = useCallback(() => {
    setErrors({})
    setTouched({})
    setAttempted(false)
  }, [])

  const summaryErrors = attempted
    ? ({ username: errors.username, password: errors.password } as Record<string, string | undefined>)
    : {}

  return { errors, touched, validateField, validateAll, markTouched, reset, summaryErrors }
}

export interface QueuedAction {
  id: string
  label: string
  run: () => void
}

/** Refresh actions requested while offline are replayed when connectivity returns. */
export function useActionQueue(online: boolean): {
  queued: QueuedAction[]
  enqueue: (action: QueuedAction) => void
  clear: () => void
} {
  const [queued, setQueued] = useState<QueuedAction[]>([])
  const drained = useRef(true)

  useEffect(() => {
    if (!online) {
      drained.current = false
      return
    }
    if (drained.current || queued.length === 0) return
    drained.current = true
    const pending = [...queued]
    setQueued([])
    pending.forEach((action) => action.run())
  }, [online, queued])

  const enqueue = useCallback((action: QueuedAction) => {
    setQueued((current) => dedupeByKey([...current, action], (item) => item.id))
  }, [])
  const clear = useCallback(() => setQueued([]), [])

  return { queued, enqueue, clear }
}

/** Returns true once the token is inside the warning window (or already past it). */
export function useSessionWarning(expiresAt: number | null, warnBeforeMs = 120_000): boolean {
  const [warning, setWarning] = useState(false)
  useEffect(() => {
    if (!expiresAt) {
      setWarning(false)
      return
    }
    const update = () => setWarning(expiresAt - Date.now() <= warnBeforeMs)
    update()
    const timer = window.setInterval(update, 15_000)
    return () => window.clearInterval(timer)
  }, [expiresAt, warnBeforeMs])
  return warning
}

export interface TableState {
  search: string
  setSearch: (value: string) => void
  debouncedSearch: string
  status: string
  setStatus: (value: string) => void
  from: string
  setFrom: (value: string) => void
  to: string
  setTo: (value: string) => void
  sortKey: string | null
  sortDirection: SortDirection
  toggleSort: (key: string) => void
  page: number
  setPage: (page: number) => void
  pageSize: number
  setPageSize: (size: number) => void
  selected: Set<string>
  toggleRow: (id: string) => void
  setSelected: (ids: string[]) => void
  clearSelection: () => void
  density: 'comfortable' | 'compact'
  setDensity: (density: 'comfortable' | 'compact') => void
  hiddenColumns: string[]
  toggleColumn: (key: string) => void
  resetFilters: () => void
}

/** All local table controls live in one place so every portal list behaves alike. */
export function useTableState(namespace: string): TableState {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 240)
  const [status, setStatusState] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSizeState] = useState(25)
  const [selected, setSelectedState] = useState<Set<string>>(new Set())
  const [density, setDensity] = useLocalStorageState<TableState['density']>(STORAGE_KEYS.density, 'comfortable')
  const [hiddenColumns, setHiddenColumns] = useLocalStorageState<string[]>(
    `${STORAGE_KEYS.hiddenColumns}:${namespace}`,
    [],
  )

  const setStatus = useCallback((value: string) => {
    setStatusState(value)
    setPage(0)
  }, [])
  const toggleSort = useCallback((key: string) => {
    setSortKey((current) => {
      if (current === key) {
        setSortDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'))
        return key
      }
      setSortDirection('asc')
      return key
    })
    setPage(0)
  }, [])
  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size)
    setPage(0)
  }, [])
  const toggleRow = useCallback((id: string) => {
    setSelectedState((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])
  const setSelected = useCallback((ids: string[]) => setSelectedState(new Set(ids)), [])
  const clearSelection = useCallback(() => setSelectedState(new Set()), [])
  const toggleColumn = useCallback(
    (key: string) => {
      setHiddenColumns((current) =>
        current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
      )
    },
    [setHiddenColumns],
  )
  const resetFilters = useCallback(() => {
    setSearch('')
    setStatusState('')
    setFrom('')
    setTo('')
    setPage(0)
  }, [])

  return useMemo(
    () => ({
      search,
      setSearch,
      debouncedSearch,
      status,
      setStatus,
      from,
      setFrom,
      to,
      setTo,
      sortKey,
      sortDirection,
      toggleSort,
      page,
      setPage,
      pageSize,
      setPageSize,
      selected,
      toggleRow,
      setSelected,
      clearSelection,
      density,
      setDensity,
      hiddenColumns,
      toggleColumn,
      resetFilters,
    }),
    [
      search,
      debouncedSearch,
      status,
      setStatus,
      from,
      to,
      sortKey,
      sortDirection,
      toggleSort,
      page,
      pageSize,
      setPageSize,
      selected,
      toggleRow,
      setSelected,
      clearSelection,
      density,
      setDensity,
      hiddenColumns,
      toggleColumn,
      resetFilters,
    ],
  )
}
