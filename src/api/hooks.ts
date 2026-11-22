import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { dataApi, errorStatus, errorMessage } from './client'
import { readSession } from '../session'
import { useOnlineStatus } from '../features/feature-pack/hooks'
import {
  backoffDelay,
  cacheKey,
  clearFeatureCache,
  guardResponseSize,
  hashString,
  normalizeItems,
  readCache,
  shouldRetry,
  writeCache,
} from '../features/feature-pack/utils'

export { formatMoney, formatDate, formatNumber, pieces } from '../features/feature-pack/utils'
export { formatMoney as money, formatDate as date } from '../features/feature-pack/utils'

export type Params = Record<string, string | number | undefined>

interface QueryResult<T> {
  data: T | null
  error: string | null
  /** HTTP status of the failed request, so screens can explain 404s properly. */
  status?: number
  loading: boolean
  /** True while a background refresh is in flight but cached data is shown. */
  updating: boolean
  lastUpdated: number | null
  truncated: boolean
  reload: () => void
}

interface CachedPayload {
  raw: unknown
  truncated: boolean
}

type JsonRecord = Record<string, unknown>

function guardPayload(raw: unknown): CachedPayload {
  if (Array.isArray(raw)) {
    const guarded = guardResponseSize<unknown>(raw)
    return { raw: guarded.items, truncated: guarded.truncated }
  }
  if (raw && typeof raw === 'object') {
    const record = raw as JsonRecord
    if (Array.isArray(record.items)) {
      const guarded = guardResponseSize<unknown>(record.items)
      return { raw: { ...record, items: guarded.items }, truncated: guarded.truncated }
    }
  }
  return { raw, truncated: false }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

/**
 * GET hook with stale-while-revalidate, session-scoped cache and retry/backoff.
 *
 * Deliberately not react-query: a handful of screens do not justify the
 * dependency, and this keeps the refresh semantics obvious. The request key
 * includes the path so two resources with the same params never share data.
 */
export function useQuery<T>(path: string, params?: Params): QueryResult<T> {
  const token = readSession()?.token ?? ''
  const laundry = readSession()?.user.laundry ?? ''
  const scope = useMemo(() => hashString(`${token}|${laundry}`), [token, laundry])
  const key = useMemo(() => cacheKey(scope, path, params), [scope, path, params])
  const online = useOnlineStatus()
  const cached = useMemo(() => readCache<CachedPayload>(key), [key])

  const [data, setData] = useState<T | null>((cached?.value.raw as T) ?? null)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<number | undefined>(undefined)
  const [loading, setLoading] = useState(!cached)
  const [updating, setUpdating] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<number | null>(cached?.fetchedAt ?? null)
  const [truncated, setTruncated] = useState(cached?.value.truncated ?? false)
  const run = useRef(0)
  const hasData = useRef(Boolean(cached))
  // Callers pass a fresh params object each render; the ref keeps the request
  // callback stable while still sending the latest values.
  const paramsRef = useRef(params)
  paramsRef.current = params

  const load = useCallback(async () => {
    const runId = ++run.current
    setError(null)
    setStatus(undefined)
    setUpdating(true)
    if (!hasData.current) setLoading(true)
    let attempt = 0
    try {
      // Retry transient network/5xx failures with a bounded exponential delay.
      // eslint-disable-next-line no-constant-condition
      while (true) {
        try {
          const response = await dataApi.get<unknown>(path, { params: paramsRef.current ?? {} })
          if (runId !== run.current) return
          const guarded = guardPayload(response.data)
          const fetchedAt = Date.now()
          writeCache(key, guarded, fetchedAt)
          setData(guarded.raw as T)
          setTruncated(guarded.truncated)
          setLastUpdated(fetchedAt)
          hasData.current = true
          return
        } catch (caught) {
          if (runId !== run.current) return
          if (shouldRetry(caught, attempt) && online) {
            attempt += 1
            await wait(backoffDelay(attempt))
            if (runId !== run.current) return
            continue
          }
          setError(errorMessage(caught))
          setStatus(errorStatus(caught))
          // Keep the previous payload visible: a failed refresh is not an
          // instruction to erase the operator's working view.
          return
        }
      }
    } finally {
      if (runId === run.current) {
        setLoading(false)
        setUpdating(false)
      }
    }
  }, [key, online, path])

  useEffect(() => {
    const fromCache = readCache<CachedPayload>(key)
    if (fromCache) {
      setData(fromCache.value.raw as T)
      setLastUpdated(fromCache.fetchedAt)
      setTruncated(fromCache.value.truncated)
      hasData.current = true
      setLoading(false)
    } else {
      setData(null)
      setLastUpdated(null)
      setTruncated(false)
      hasData.current = false
      setLoading(true)
    }
    void load()
    return () => {
      run.current += 1
    }
  }, [key, load])

  // The global refresh shortcut and the refresh button share one event.
  useEffect(() => {
    const onRefresh = () => void load()
    window.addEventListener('ll_hotel:refresh', onRefresh)
    return () => window.removeEventListener('ll_hotel:refresh', onRefresh)
  }, [load])

  useEffect(() => {
    const onSignOut = () => {
      clearFeatureCache()
      run.current += 1
      setData(null)
      setLastUpdated(null)
      hasData.current = false
    }
    window.addEventListener('ll_hotel:force-signout', onSignOut)
    window.addEventListener('ll_hotel:unauthorized', onSignOut)
    return () => {
      window.removeEventListener('ll_hotel:force-signout', onSignOut)
      window.removeEventListener('ll_hotel:unauthorized', onSignOut)
    }
  }, [])

  return {
    data,
    error,
    status,
    loading,
    updating,
    lastUpdated,
    truncated,
    reload: () => void load(),
  }
}

/** Used by list screens so a null `items` field never crashes the table. */
export function itemsOf<T>(value: unknown): T[] {
  return normalizeItems<T>(value)
}
