/**
 * Pure helpers for the hotel portal feature pack.
 *
 * Nothing in this module reads app state at import time, so the formatting,
 * filtering, pagination and validation helpers can be unit tested on their own.
 */

export type JsonRecord = Record<string, unknown>

export type SortDirection = 'asc' | 'desc'

export interface AssociationLike {
  laundry_id: string
  laundry_name: string
  client_name: string
  client_type: string
  role_id: string
  status: string
}

export interface TableFilters {
  search?: string
  status?: string
  from?: string
  to?: string
}

export const HOTEL_ROLES = ['HOTEL_ADMIN', 'HOTEL_MANAGER'] as const
export type HotelRole = (typeof HOTEL_ROLES)[number]

/** Roles that belong to the laundry/staff side and must never authorise this app. */
const FOREIGN_ROLES = new Set(['ADMIN', 'MANAGER', 'STAFF', 'SHOP_ADMIN', 'SHOP_MANAGER', 'SHOP_STAFF'])

export const STORAGE_KEYS = {
  sidebarCollapsed: 'll_hotel_sidebar_collapsed',
  density: 'll_hotel_table_density',
  hiddenColumns: 'll_hotel_hidden_columns',
  lastLaundry: 'll_hotel_last_laundry',
  lastSignIn: 'll_hotel_last_signin',
  highContrast: 'll_hotel_high_contrast',
  largeText: 'll_hotel_large_text',
  reducedMotion: 'll_hotel_reduced_motion',
  notifications: 'll_hotel_notifications',
  draftPrefix: 'll_hotel_draft_',
} as const

/* ── Storage ─────────────────────────────────────────────────────────────── */

export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* Private browsing or a full quota must not break the portal. */
  }
}

/** Persistence that surfaces failures so optimistic UI can roll back. */
export function writeJsonStrict(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value))
}

export function removeKey(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    /* See writeJson. */
  }
}

/* ── Normalisation ───────────────────────────────────────────────────────── */

/** API list responses regularly arrive with `items: null`; treat that as empty. */
export function normalizeItems<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[]
  if (value && typeof value === 'object' && Array.isArray((value as JsonRecord).items)) {
    return (value as JsonRecord).items as T[]
  }
  return []
}

export function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as JsonRecord) : {}
}

export function stringValue(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return fallback
}

export function normalizeStatus(value: unknown, fallback = 'ACTIVE'): string {
  const status = stringValue(value).trim().toUpperCase()
  return status || fallback
}

/** A HOTEL role is the only role shape this portal understands. */
export function normalizeHotelRole(value: unknown): HotelRole {
  const role = stringValue(value).trim().toUpperCase()
  return role === 'HOTEL_MANAGER' ? 'HOTEL_MANAGER' : 'HOTEL_ADMIN'
}

export function isHotelRole(value: unknown): value is HotelRole {
  return HOTEL_ROLES.includes(stringValue(value).trim().toUpperCase() as HotelRole)
}

/**
 * Reject generic staff roles before they can be shown as a hotel identity.
 * An empty/unknown role is normalised to a HOTEL default rather than trusted.
 */
export function assertHotelRole(value: unknown): HotelRole {
  const role = stringValue(value).trim().toUpperCase()
  if (FOREIGN_ROLES.has(role)) {
    throw new Error('This account is not a hotel account. Use the hotel sign-in.')
  }
  if (role && !isHotelRole(role)) {
    throw new Error('This account has an unrecognised hotel role. Contact your administrator.')
  }
  return normalizeHotelRole(role)
}

export function friendlyRole(role: unknown): string {
  const value = stringValue(role).trim()
  if (!value) return 'Hotel account'
  if (!isHotelRole(value)) return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
  return value === 'HOTEL_MANAGER' ? 'Hotel manager' : 'Hotel admin'
}

/**
 * Multi-laundry 409 candidates only carry ids and names. Fill display-only
 * defaults here; the server still decides whether the association may sign in.
 */
export function normalizeAssociation(raw: unknown): AssociationLike {
  const item = asRecord(raw)
  const clientType = stringValue(item.client_type).trim().toUpperCase() || 'HOTEL'
  const roleId = stringValue(item.role_id).trim().toUpperCase() || normalizeHotelRole('')
  return {
    laundry_id: stringValue(item.laundry_id),
    laundry_name: stringValue(item.laundry_name, stringValue(item.laundry_id)),
    client_name: stringValue(item.client_name),
    client_type: clientType,
    role_id: roleId,
    status: normalizeStatus(item.status),
  }
}

export function normalizeAssociations(value: unknown): AssociationLike[] {
  return normalizeItems<unknown>(value).map(normalizeAssociation)
}

/** This bundle is the hotel client only; never let a shop token reach it. */
export function assertHotelClientType(value: unknown): 'HOTEL' {
  const clientType = stringValue(value).trim().toUpperCase()
  if (clientType && clientType !== 'HOTEL') {
    throw new Error('This portal only accepts hotel accounts.')
  }
  return 'HOTEL'
}

export function rememberLaundry(laundryId: string | undefined): void {
  if (!laundryId) return
  writeJson(STORAGE_KEYS.lastLaundry, laundryId)
}

export function lastRememberedLaundry(): string | undefined {
  const value = readJson<string | null>(STORAGE_KEYS.lastLaundry, null)
  return value ?? undefined
}

/** Sort remembered laundry first, keep disabled choices visible at the end. */
export function orderChoices<T extends { laundry_id: string; status: string }>(
  choices: T[],
  preferredId: string | undefined,
): T[] {
  return [...choices].sort((a, b) => {
    const aActive = normalizeStatus(a.status) === 'ACTIVE' ? 0 : 1
    const bActive = normalizeStatus(b.status) === 'ACTIVE' ? 0 : 1
    if (aActive !== bActive) return aActive - bActive
    if (preferredId && a.laundry_id === preferredId) return -1
    if (preferredId && b.laundry_id === preferredId) return 1
    return a.laundry_id.localeCompare(b.laundry_id)
  })
}

/* ── Formatting ──────────────────────────────────────────────────────────── */

export function formatNumber(value: number | string | null | undefined): string {
  const amount = typeof value === 'string' ? Number(value) : (value ?? 0)
  if (!Number.isFinite(amount)) return '—'
  return new Intl.NumberFormat('en-LK', { maximumFractionDigits: 2 }).format(amount)
}

export function formatMoney(value: number | string | null | undefined, currency = 'LKR'): string {
  const amount = typeof value === 'string' ? Number(value) : (value ?? 0)
  if (!Number.isFinite(amount)) return '—'
  try {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${currency} ${formatNumber(amount)}`
  }
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatDateTime(value: string | number | Date | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—'
  const parsed = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(parsed.getTime())) return String(value)
  return parsed.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatRelative(value: string | number | Date | null | undefined, now = Date.now()): string {
  if (value === null || value === undefined || value === '') return '—'
  const time = value instanceof Date ? value.getTime() : new Date(value).getTime()
  if (!Number.isFinite(time)) return String(value)
  const seconds = Math.max(0, Math.round((now - time) / 1000))
  if (seconds < 45) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.round(hours / 24)
  return days === 1 ? 'yesterday' : `${days} days ago`
}

export function truncate(value: string, max = 28): string {
  if (value.length <= max) return value
  return `${value.slice(0, Math.max(1, max - 1))}…`
}

/* ── Errors and messages ─────────────────────────────────────────────────── */

export function errorStatus(error: unknown): number | undefined {
  const response = asRecord(asRecord(error).response)
  const status = response.status
  return typeof status === 'number' ? status : undefined
}

export function errorCode(error: unknown): string {
  return stringValue(asRecord(error).code).toUpperCase()
}

/** One consistent message for axios errors, strings and thrown values. */
export function normalizeError(error: unknown): string {
  if (typeof error === 'string' && error.trim()) return error.trim()
  const record = asRecord(error)
  const response = asRecord(record.response)
  const data = asRecord(response.data)
  const detail = data.detail ?? data.message ?? record.message
  const text = stringValue(detail).trim()
  const status = errorStatus(error)
  const code = errorCode(error)
  if (code === 'ECONNABORTED' || /timeout/i.test(text)) {
    return 'The server took too long to respond. Try again.'
  }
  if (status === 404) return 'The requested information is not available yet.'
  if (status === 409) return text || 'That selection conflicts with another record. Refresh and try again.'
  if (status === 403) return text || 'This account does not have access to that action.'
  if (status === 401) return 'Your session has ended. Sign in again to continue.'
  if (status) return text || `The request could not be completed (${status}). Try again.`
  if (!response && (error !== null || text)) {
    if (text && !/^axios/i.test(text)) return text
    return 'Cannot reach the server. Check your connection.'
  }
  return text || 'Something went wrong. Try again.'
}

/* ── Tables ──────────────────────────────────────────────────────────────── */

export function clampPage(page: number, pageCount: number): number {
  if (!Number.isFinite(page)) return 0
  if (pageCount <= 0) return 0
  return Math.min(Math.max(0, Math.trunc(page)), pageCount - 1)
}

export function pageRange(page: number, pageSize: number, total: number): { start: number; end: number } {
  if (total <= 0) return { start: 0, end: 0 }
  const safePage = clampPage(page, Math.ceil(total / Math.max(1, pageSize)))
  const start = safePage * pageSize + 1
  return { start, end: Math.min(total, start + pageSize - 1) }
}

export function sortRows<T>(
  rows: T[],
  key: string | null,
  direction: SortDirection,
  getValue: (row: T, key: string) => string | number | null | undefined,
): T[] {
  if (!key) return rows
  const factor = direction === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    const left = getValue(a, key)
    const right = getValue(b, key)
    if (left === null || left === undefined) return 1
    if (right === null || right === undefined) return -1
    if (typeof left === 'number' && typeof right === 'number') return (left - right) * factor
    return String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: 'base' }) * factor
  })
}

function isoDate(value: unknown): number | null {
  if (!value) return null
  const time = new Date(String(value)).getTime()
  return Number.isFinite(time) ? time : null
}

export function filterRows<T>(
  rows: T[],
  filters: TableFilters,
  getters: {
    search?: (row: T) => Array<string | number | null | undefined>
    status?: (row: T) => string | null | undefined
    date?: (row: T) => string | null | undefined
  },
): T[] {
  const needle = (filters.search ?? '').trim().toLowerCase()
  const status = (filters.status ?? '').trim().toUpperCase()
  const from = isoDate(filters.from)
  const to = isoDate(filters.to)
  return rows.filter((row) => {
    if (needle && getters.search) {
      const haystack = getters.search(row).filter((v) => v !== null && v !== undefined).map(String).join(' ').toLowerCase()
      if (!haystack.includes(needle)) return false
    }
    if (status && normalizeStatus(getters.status?.(row), '') !== status) return false
    if ((from !== null || to !== null) && getters.date) {
      const time = isoDate(getters.date(row))
      if (time === null) return false
      if (from !== null && time < from) return false
      if (to !== null && time > to + 86_399_000) return false
    }
    return true
  })
}

export function duplicateIds<T>(rows: T[], getId: (row: T) => string): string[] {
  const seen = new Set<string>()
  const duplicates = new Set<string>()
  rows.forEach((row) => {
    const id = getId(row)
    if (seen.has(id)) duplicates.add(id)
    seen.add(id)
  })
  return [...duplicates]
}

/** Total the nested line items of a gate pass, delivery or invoice. */
export function pieces(items: unknown): number {
  return aggregateNestedItems({ items }).pieces
}

export function dedupeById<T>(rows: T[], getId: (row: T) => string): T[] {
  const seen = new Set<string>()
  return rows.filter((row) => {
    const id = getId(row)
    if (seen.has(id)) return false
    seen.add(id)
    return true
  })
}

/** Nested item arrays carry quantities under several names; total them once. */
export function aggregateNestedItems(row: unknown): { pieces: number; lines: number; categories: Record<string, number> } {
  const items = normalizeItems<unknown>(asRecord(row).items)
  const categories: Record<string, number> = {}
  let pieces = 0
  items.forEach((raw) => {
    const item = asRecord(raw)
    const qty = Number(item.client_qty ?? item.received_qty ?? item.delivered_qty ?? item.quantity ?? 0)
    if (Number.isFinite(qty)) pieces += qty
    const category = stringValue(item.category ?? item.item_type ?? item.description, 'Other')
    categories[category] = (categories[category] ?? 0) + (Number.isFinite(qty) ? qty : 0)
  })
  return { pieces, lines: items.length, categories }
}

/* ── Export / clipboard ──────────────────────────────────────────────────── */

export function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value)
  return `"${text.replaceAll('"', '""')}"`
}

export function toCsv<T>(rows: T[], columns: Array<{ key: string; label: string; value: (row: T) => unknown }>): string {
  const header = columns.map((column) => csvCell(column.label)).join(',')
  const body = rows.map((row) => columns.map((column) => csvCell(column.value(row))).join(','))
  return [header, ...body].join('\r\n')
}

export function toJson<T>(rows: T[], columns?: Array<{ key: string }>): string {
  if (!columns) return JSON.stringify(rows, null, 2)
  return JSON.stringify(
    rows.map((row) => Object.fromEntries(columns.map((column) => [column.key, (row as JsonRecord)[column.key]]))),
    null,
    2,
  )
}

export function downloadText(filename: string, content: string, mime = 'text/plain;charset=utf-8'): void {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value)
    return true
  } catch {
    return false
  }
}

/* ── Cache / requests ────────────────────────────────────────────────────── */

export function hashString(value: string): string {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

/** Cache entries are scoped by session so one hotel can never see another's data. */
export function cacheKey(scope: string, path: string, params?: Record<string, string | number | undefined>): string {
  const filtered = Object.entries(params ?? {})
    .filter(([, value]) => value !== undefined && value !== '')
    .sort(([a], [b]) => a.localeCompare(b))
  return `${scope}:${path}:${JSON.stringify(filtered)}`
}

interface CacheEntry<T> {
  value: T
  fetchedAt: number
}

const queryCache = new Map<string, CacheEntry<unknown>>()

export function readCache<T>(key: string): CacheEntry<T> | undefined {
  return queryCache.get(key) as CacheEntry<T> | undefined
}

export function writeCache<T>(key: string, value: T, fetchedAt = Date.now()): CacheEntry<T> {
  const entry = { value, fetchedAt }
  queryCache.set(key, entry as CacheEntry<unknown>)
  return entry
}

/** Called by sign-out, 401 handling and the error boundary reset. */
export function clearFeatureCache(): void {
  queryCache.clear()
}

export function createIdempotencyKey(): string {
  const random = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Date.now())
  return `hotel-${Date.now()}-${random}`
}

export function backoffDelay(attempt: number, base = 400, cap = 4000): number {
  if (attempt <= 0) return 0
  return Math.min(cap, base * 2 ** (attempt - 1))
}

export function shouldRetry(error: unknown, attempt: number, maxAttempts = 2): boolean {
  const status = errorStatus(error)
  const code = errorCode(error)
  if (attempt >= maxAttempts) return false
  if (code === 'ECONNABORTED' || status === undefined) return true
  return status >= 500
}

export const MAX_RESPONSE_ITEMS = 500

/** Guard against an unexpectedly large payload before it reaches a table. */
export function guardResponseSize<T>(items: T[], limit = MAX_RESPONSE_ITEMS): { items: T[]; truncated: boolean } {
  if (items.length <= limit) return { items, truncated: false }
  return { items: items.slice(0, limit), truncated: true }
}

/** Tokens never leave the hotel portal; a guard for accidental future routes. */
export function isSafePortalPath(path: string): boolean {
  const normalized = path.toLowerCase()
  if (normalized === '/today' || normalized.startsWith('/today/')) return false
  if (/\/client-portal\//.test(normalized)) return true
  if (normalized.startsWith('/client/auth/')) return true
  return false
}

/* ── Forms ───────────────────────────────────────────────────────────────── */

export interface CredentialsInput {
  username: string
  password: string
}

export type FieldErrors = Partial<Record<'username' | 'password' | 'confirm', string>>

export function validateCredentials(input: CredentialsInput, mode: 'signin' | 'check' = 'signin'): FieldErrors {
  const errors: FieldErrors = {}
  const username = input.username.trim()
  if (!username) errors.username = 'Enter your account username.'
  else if (username.length < 3) errors.username = 'Use at least 3 characters.'
  else if (username.length > 80) errors.username = 'Keep the username under 80 characters.'
  if (!input.password) errors.password = 'Enter your password.'
  else if (mode === 'check' && input.password.length < 10) errors.password = 'Use at least 10 characters for a new password.'
  return errors
}

export function passwordStrength(value: string): { score: number; label: string; tone: 'weak' | 'fair' | 'strong' } {
  if (!value) return { score: 0, label: 'Not entered', tone: 'weak' }
  let score = 0
  if (value.length >= 10) score += 1
  if (value.length >= 14) score += 1
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1
  if (/\d/.test(value)) score += 1
  if (/[^A-Za-z0-9]/.test(value)) score += 1
  if (score <= 2) return { score, label: 'Weak', tone: 'weak' }
  if (score <= 3) return { score, label: 'Fair', tone: 'fair' }
  return { score, label: 'Strong', tone: 'strong' }
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.values(errors).some(Boolean)
}

/* ── Steps ───────────────────────────────────────────────────────────────── */

export function stepStatus(index: number, current: number): 'done' | 'current' | 'todo' {
  if (index < current) return 'done'
  if (index === current) return 'current'
  return 'todo'
}
