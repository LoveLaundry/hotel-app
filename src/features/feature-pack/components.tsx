import {
  Component,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ErrorInfo,
  type ReactNode,
} from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpToLine,
  Bell,
  Check,
  ChevronDown,
  CircleAlert,
  Clipboard,
  Columns3,
  Command,
  Copy,
  Download,
  Eye,
  FileJson,
  FileSpreadsheet,
  HelpCircle,
  Info,
  Keyboard,
  LoaderCircle,
  LogOut,
  Menu,
  RefreshCw,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  WifiOff,
  X,
} from 'lucide-react'
import clsx from 'clsx'
import { appConfig } from '../../config/app'
import { useEscape, useFocusTrap, useOnlineStatus, useTableState, useSessionWarning } from './hooks'
import { useFeatures } from './context'
import {
  assertFeatureCatalog,
  FEATURE_AREAS,
  FEATURES,
  searchFeatures,
  type FeatureEntry,
} from './manifest'
import {
  clearFeatureCache,
  copyText,
  csvCell,
  dedupeById,
  downloadText,
  duplicateIds,
  filterRows,
  formatDateTime,
  formatNumber,
  pageRange,
  passwordStrength,
  sortRows,
  stepStatus,
  toCsv,
  toJson,
  truncate,
  type SortDirection,
} from './utils'

export { clearFeatureCache } from './utils'

/* ── Shell primitives ────────────────────────────────────────────────────── */

export function SkipLink() {
  return (
    <a href="#main-content" className="fp-skip-link">
      Skip to main content
    </a>
  )
}

export function BackToTop() {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const update = () => setVisible(window.scrollY > 420)
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])
  if (!visible) return null
  return (
    <button
      type="button"
      className="fp-back-to-top"
      aria-label="Back to top of page"
      onClick={() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
        document.getElementById('main-content')?.focus()
      }}
    >
      <ArrowUpToLine aria-hidden="true" />
    </button>
  )
}

export function RouteProgress({ active }: { active: boolean }) {
  return (
    <div className={clsx('fp-route-progress', active && 'is-active')} aria-hidden="true">
      <span />
    </div>
  )
}

export function ScopeBadge({ label }: { label?: string }) {
  return (
    <span className="fp-scope-badge" title={label ? `Scope: ${label}` : 'Hotel account'}>
      <span className="fp-scope-dot" aria-hidden="true" />
      <span className="sr-only">Account scope: </span>
      {truncate(label || 'Hotel', 24)}
      <span className="fp-scope-type">HOTEL</span>
    </span>
  )
}

export function LastSignInInfo() {
  const { lastSignIn } = useFeatures()
  if (!lastSignIn) return null
  return (
    <p className="fp-muted fp-last-signin">
      Last sign-in: {formatDateTime(lastSignIn.at)} · {lastSignIn.name}
    </p>
  )
}

export function DataFreshness({ at, loading }: { at: number | null; loading?: boolean }) {
  if (loading) {
    return (
      <span className="fp-freshness" role="status">
        <LoaderCircle size={12} aria-hidden="true" /> Refreshing…
      </span>
    )
  }
  if (!at) return null
  return (
    <span className="fp-freshness" title={new Date(at).toISOString()}>
      Updated {formatDateTime(at)}
    </span>
  )
}

export function RefreshButton({ onRefresh, label = 'Refresh data' }: { onRefresh: () => void; label?: string }) {
  const { online, enqueueRefresh, notify } = useFeatures()
  return (
    <button
      type="button"
      className="btn btn-secondary"
      aria-label={label}
      onClick={() => {
        if (online) {
          onRefresh()
          notify('Refreshing records…', 'info')
        } else {
          enqueueRefresh({ id: `refresh:${label}`, label, run: onRefresh })
          notify('Offline — refresh queued until you reconnect.', 'info')
        }
      }}
    >
      <RefreshCw aria-hidden="true" />
      Refresh
    </button>
  )
}

/* ── Accessibility helpers ───────────────────────────────────────────────── */

export function RequiredMark() {
  return (
    <span className="fp-required" aria-hidden="true">
      *
      <span className="sr-only"> required</span>
    </span>
  )
}

export function HelpTip({ text, label = 'More information' }: { text: string; label?: string }) {
  return (
    <span className="fp-help-tip" tabIndex={0} role="note" aria-label={`${label}: ${text}`} title={text}>
      <HelpCircle size={13} aria-hidden="true" />
      <span className="sr-only">{text}</span>
    </span>
  )
}

export function TruncatedText({ value, max = 28 }: { value: string; max?: number }) {
  const shortened = truncate(value, max)
  return (
    <span title={shortened !== value ? value : undefined} className="fp-truncate">
      {shortened}
    </span>
  )
}

export function CharCounter({ value, max }: { value: string; max: number }) {
  return (
    <span className={clsx('fp-counter', value.length > max && 'is-over')} aria-live="polite">
      {value.length}/{max}
    </span>
  )
}

export function AutosaveIndicator({ status }: { status: 'idle' | 'saving' | 'saved' | 'unavailable' }) {
  const text =
    status === 'saving'
      ? 'Saving draft…'
      : status === 'saved'
        ? 'Draft saved locally'
        : status === 'unavailable'
          ? 'Draft storage unavailable'
          : ''
  if (!text) return null
  return (
    <span className="fp-autosave" role="status">
      <Check size={12} aria-hidden="true" /> {text}
    </span>
  )
}

export function DraftBanner({ onRestore, onDiscard }: { onRestore: () => void; onDiscard: () => void }) {
  return (
    <div className="fp-draft-banner" role="status">
      <Info size={15} aria-hidden="true" />
      <span>A previous username draft was found on this device.</span>
      <button type="button" className="link-button" onClick={onRestore}>
        Restore
      </button>
      <button type="button" className="link-button" onClick={onDiscard}>
        Discard
      </button>
    </div>
  )
}

export function ErrorSummary({ errors, title = 'Check the highlighted fields' }: { errors: Record<string, string | undefined>; title?: string }) {
  const entries = Object.entries(errors).filter(([, message]) => Boolean(message))
  if (entries.length === 0) return null
  return (
    <div className="fp-error-summary" role="alert">
      <strong>{title}</strong>
      <ul>
        {entries.map(([field, message]) => (
          <li key={field}>
            <a href={`#fp-field-${field}`}>{message}</a>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function StepIndicator({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="fp-steps" aria-label="Progress">
      {steps.map((label, index) => {
        const status = stepStatus(index, current)
        return (
          <li key={label} className={clsx('fp-step', `is-${status}`)} aria-current={status === 'current' ? 'step' : undefined}>
            <span aria-hidden="true">{status === 'done' ? <Check size={12} /> : index + 1}</span>
            {label}
          </li>
        )
      })}
    </ol>
  )
}

export function PasswordStrengthMeter({ value }: { value: string }) {
  const strength = passwordStrength(value)
  return (
    <div className="fp-strength" aria-live="polite">
      <div className="fp-strength-bars" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((index) => (
          <span key={index} className={clsx(strength.score >= index && `is-${strength.tone}`)} />
        ))}
      </div>
      <span className={`fp-strength-label is-${strength.tone}`}>{strength.label}</span>
    </div>
  )
}

export function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string
  children: ReactNode
  defaultOpen?: boolean
}) {
  return (
    <details className="fp-collapsible" open={defaultOpen}>
      <summary>
        <ChevronDown size={14} aria-hidden="true" />
        {title}
      </summary>
      <div className="fp-collapsible-body">{children}</div>
    </details>
  )
}

/* ── Overlays ────────────────────────────────────────────────────────────── */

export function Drawer({
  open,
  title,
  onClose,
  children,
  side = 'right',
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  side?: 'left' | 'right'
}) {
  const trapRef = useFocusTrap<HTMLDivElement>(open)
  useEscape(open, onClose)
  if (!open) return null
  return (
    <div className="fp-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div
        ref={trapRef}
        className={clsx('fp-drawer', side === 'left' ? 'is-left' : 'is-right')}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        <div className="fp-drawer-head">
          <h2>{title}</h2>
          <button type="button" className="btn btn-ghost fp-icon-button" onClick={onClose} aria-label={`Close ${title}`}>
            <X aria-hidden="true" />
          </button>
        </div>
        <div className="fp-drawer-body">{children}</div>
      </div>
    </div>
  )
}

export function ConfirmDialog() {
  const { confirmRequest, closeConfirm } = useFeatures()
  const open = Boolean(confirmRequest)
  const trapRef = useFocusTrap<HTMLDivElement>(open)
  useEscape(open, closeConfirm)
  if (!confirmRequest) return null
  return (
    <div className="fp-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && closeConfirm()}>
      <div ref={trapRef} className="fp-dialog" role="alertdialog" aria-modal="true" aria-labelledby="fp-confirm-title" tabIndex={-1}>
        <div className="fp-dialog-icon" aria-hidden="true">
          <ShieldAlert />
        </div>
        <h2 id="fp-confirm-title">{confirmRequest.title}</h2>
        <p>{confirmRequest.body}</p>
        <div className="fp-dialog-actions">
          <button type="button" className="btn btn-secondary" onClick={closeConfirm}>
            Cancel
          </button>
          <button
            type="button"
            className={clsx('btn', confirmRequest.tone === 'danger' ? 'btn-primary' : 'btn-secondary')}
            onClick={() => {
              confirmRequest.onConfirm()
              closeConfirm()
            }}
          >
            {confirmRequest.confirmLabel ?? 'Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function ShortcutHelpDialog() {
  const { shortcutsOpen, setShortcutsOpen, requestConfirm, clearPortalState } = useFeatures()
  const trapRef = useFocusTrap<HTMLDivElement>(shortcutsOpen)
  useEscape(shortcutsOpen, () => setShortcutsOpen(false))
  const shortcuts: Array<[string, string]> = [
    ['Ctrl / ⌘ + K', 'Open the command palette'],
    ['?', 'Show this shortcut help'],
    ['/', 'Focus the active table search'],
    ['R', 'Refresh the current page data'],
    ['Escape', 'Close any overlay or drawer'],
    ['Enter / Space', 'Open the focused table row'],
  ]
  if (!shortcutsOpen) return null
  return (
    <div className="fp-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setShortcutsOpen(false)}>
      <div ref={trapRef} className="fp-dialog fp-dialog-wide" role="dialog" aria-modal="true" aria-labelledby="fp-shortcuts-title" tabIndex={-1}>
        <div className="fp-drawer-head">
          <h2 id="fp-shortcuts-title">Keyboard shortcuts</h2>
          <button type="button" className="btn btn-ghost fp-icon-button" onClick={() => setShortcutsOpen(false)} aria-label="Close keyboard shortcuts">
            <X aria-hidden="true" />
          </button>
        </div>
        <dl className="fp-shortcut-list">
          {shortcuts.map(([key, description]) => (
            <div key={key}>
              <dt><kbd>{key}</kbd></dt>
              <dd>{description}</dd>
            </div>
          ))}
        </dl>
        <CollapsibleSection title="Accessibility preferences">
          <AccessibilityToggles />
        </CollapsibleSection>
        <div className="fp-dialog-actions fp-dialog-actions-split">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() =>
              requestConfirm({
                title: 'Exit safely?',
                body: 'This signs you out and clears portal data stored on this device. No external support session is created.',
                confirmLabel: 'Exit safely',
                tone: 'danger',
                onConfirm: clearPortalState,
              })
            }
          >
            <LogOut aria-hidden="true" /> Exit safely
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => setShortcutsOpen(false)}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

export function AccessibilityToggles() {
  const { highContrast, largeText, reducedMotion, toggleHighContrast, toggleLargeText, toggleReducedMotion } = useFeatures()
  const options: Array<[string, boolean, () => void]> = [
    ['High contrast', highContrast, toggleHighContrast],
    ['Large text', largeText, toggleLargeText],
    ['Reduce motion', reducedMotion, toggleReducedMotion],
  ]
  return (
    <div className="fp-toggle-list">
      {options.map(([label, checked, toggle]) => (
        <label key={label} className="fp-toggle">
          <input type="checkbox" checked={checked} onChange={toggle} />
          {label}
        </label>
      ))}
    </div>
  )
}

export interface PaletteCommand {
  id: string
  label: string
  hint?: string
  path?: string
  action?: () => void
}

export function CommandPalette({
  open,
  onClose,
  commands,
}: {
  open: boolean
  onClose: () => void
  commands: PaletteCommand[]
}) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const trapRef = useFocusTrap<HTMLDivElement>(open)
  useEscape(open, onClose)
  useEffect(() => {
    if (open) setQuery('')
  }, [open])

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const matches = needle ? commands.filter((command) => `${command.label} ${command.hint ?? ''}`.toLowerCase().includes(needle)) : commands
    return matches.slice(0, 9)
  }, [commands, query])

  if (!open) return null
  return (
    <div className="fp-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div ref={trapRef} className="fp-palette" role="dialog" aria-modal="true" aria-label="Command palette" tabIndex={-1}>
        <div className="fp-palette-input">
          <Search size={16} aria-hidden="true" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== 'Enter') return
              const first = results[0]
              if (!first) return
              if (first.path) navigate(first.path)
              else first.action?.()
              onClose()
            }}
            placeholder="Search pages and actions…"
            aria-label="Search pages and actions"
          />
          <kbd>Esc</kbd>
        </div>
        <ul className="fp-palette-results">
          {results.length === 0 ? <li className="fp-palette-empty">No commands match that search.</li> : null}
          {results.map((command) => (
            <li key={command.id}>
              <button
                type="button"
                onClick={() => {
                  if (command.path) navigate(command.path)
                  else command.action?.()
                  onClose()
                }}
              >
                <Command size={14} aria-hidden="true" />
                <span>{command.label}</span>
                {command.hint ? <small>{command.hint}</small> : null}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export function ToastStack() {
  const { toasts, dismissToast } = useFeatures()
  if (toasts.length === 0) return null
  return (
    <div className="fp-toasts" role="region" aria-label="Notifications">
      {toasts.map((toast) => (
        <div key={toast.id} className={clsx('fp-toast', `is-${toast.tone}`)} role="status">
          {toast.tone === 'error' ? <CircleAlert size={15} aria-hidden="true" /> : <Check size={15} aria-hidden="true" />}
          <span>{toast.message}</span>
          <button type="button" onClick={() => dismissToast(toast.id)} aria-label="Dismiss notification">
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  )
}

export function OfflineBanner() {
  const { online, queued, clearQueue } = useFeatures()
  if (online) return null
  return (
    <div className="fp-offline-banner" role="status">
      <WifiOff size={14} aria-hidden="true" />
      You are offline. Records shown are the last loaded copy.
      {queued.length > 0 ? (
        <>
          <span className="fp-queue-count">{queued.length} queued action{queued.length === 1 ? '' : 's'}</span>
          <button type="button" className="link-button" onClick={clearQueue}>
            Clear queue
          </button>
        </>
      ) : null}
    </div>
  )
}

export function SessionExpiryBanner({ onRefresh, onSignOut }: { onRefresh: () => void; onSignOut: () => void }) {
  const { sessionWarning, expiresAt } = useFeatures()
  if (!sessionWarning || !expiresAt) return null
  return (
    <div className="fp-session-warning" role="alert">
      <ShieldAlert size={15} aria-hidden="true" />
      <span>Your session expires at {formatDateTime(expiresAt)}.</span>
      <button type="button" className="link-button" onClick={onRefresh}>
        Check session
      </button>
      <button type="button" className="link-button" onClick={onSignOut}>
        Sign out now
      </button>
    </div>
  )
}

export function NotificationBell() {
  const { notifications, unreadCount, notificationsOpen, setNotificationsOpen, markRead, markAllRead } = useFeatures()
  const trapRef = useFocusTrap<HTMLDivElement>(notificationsOpen)
  useEscape(notificationsOpen, () => setNotificationsOpen(false))
  return (
    <>
      <button
        type="button"
        className="btn btn-ghost fp-icon-button fp-bell"
        aria-label={`Notifications, ${unreadCount} unread`}
        aria-expanded={notificationsOpen}
        onClick={() => setNotificationsOpen(!notificationsOpen)}
      >
        <Bell aria-hidden="true" />
        {unreadCount > 0 ? <span className="fp-badge" aria-hidden="true">{unreadCount > 9 ? '9+' : unreadCount}</span> : null}
      </button>
      {notificationsOpen ? (
        <div className="fp-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setNotificationsOpen(false)}>
          <div ref={trapRef} className="fp-dialog fp-dialog-wide" role="dialog" aria-modal="true" aria-labelledby="fp-notification-title" tabIndex={-1}>
            <div className="fp-drawer-head">
              <h2 id="fp-notification-title">Notifications</h2>
              <button type="button" className="btn btn-ghost fp-icon-button" onClick={() => setNotificationsOpen(false)} aria-label="Close notifications">
                <X aria-hidden="true" />
              </button>
            </div>
            {notifications.length === 0 ? (
              <p className="fp-muted">No notifications yet. Sign-in and refresh updates appear here.</p>
            ) : (
              <>
                <div className="fp-dialog-actions">
                  <button type="button" className="link-button" onClick={markAllRead}>
                    Mark all as read
                  </button>
                </div>
                <ul className="fp-notification-list">
                  {notifications.map((item) => (
                    <li key={item.id} className={clsx(!item.read && 'is-unread')}>
                      <button type="button" onClick={() => markRead(item.id)}>
                        <strong>{item.title}</strong>
                        <span>{item.body}</span>
                        <small>{formatDateTime(item.at)}</small>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  )
}

/* ── Data table ──────────────────────────────────────────────────────────── */

export interface TableColumn<T> {
  key: string
  label: string
  render: (row: T) => ReactNode
  exportValue?: (row: T) => string | number | null | undefined
  sortValue?: (row: T) => string | number | null | undefined
  optional?: boolean
  cardLabel?: boolean
}

export interface FeatureTableProps<T> {
  namespace: string
  caption: string
  rows: T[]
  columns: TableColumn<T>[]
  getRowId: (row: T) => string
  getStatus?: (row: T) => string | null | undefined
  getDate?: (row: T) => string | null | undefined
  searchText?: (row: T) => Array<string | number | null | undefined>
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  onRefresh?: () => void
  renderDetail?: (row: T) => ReactNode
  detailTitle?: (row: T) => string
  toolbar?: ReactNode
  emptyTitle?: string
  emptyDetail?: string
}

export function SkeletonRows({ columns = 5, rows = 5 }: { columns?: number; rows?: number }) {
  return (
    <div className="data-table-wrap" role="status" aria-label="Loading rows">
      <table className="data-table fp-table">
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }).map((__, columnIndex) => (
                <td key={columnIndex}>
                  <span className="fp-skeleton" style={{ width: `${55 + ((rowIndex + columnIndex) % 4) * 10}%` }} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function FeatureTable<T>({
  namespace,
  caption,
  rows,
  columns,
  getRowId,
  getStatus,
  getDate,
  searchText,
  loading = false,
  error = null,
  onRetry,
  onRefresh,
  renderDetail,
  detailTitle,
  toolbar,
  emptyTitle = 'No records yet',
  emptyDetail = 'Records will appear here once they are available.',
}: FeatureTableProps<T>) {
  const table = useTableState(namespace)
  const { notify, online, enqueueRefresh } = useFeatures()
  const searchRef = useRef<HTMLInputElement | null>(null)
  const selectAllRef = useRef<HTMLInputElement | null>(null)
  const [detailRow, setDetailRow] = useState<T | null>(null)

  const safeRows = useMemo(() => dedupeById(rows, getRowId), [rows, getRowId])
  const duplicates = useMemo(() => duplicateIds(rows, getRowId), [rows, getRowId])

  const filtered = useMemo(
    () =>
      filterRows(safeRows, { search: table.debouncedSearch, status: table.status, from: table.from, to: table.to }, {
        search: searchText,
        status: getStatus,
        date: getDate,
      }),
    [safeRows, table.debouncedSearch, table.status, table.from, table.to, searchText, getStatus, getDate],
  )

  const sorted = useMemo(
    () =>
      sortRows(filtered, table.sortKey, table.sortDirection, (row, key) => {
        const column = columns.find((item) => item.key === key)
        return column?.sortValue?.(row) ?? column?.exportValue?.(row) ?? null
      }),
    [filtered, table.sortKey, table.sortDirection, columns],
  )

  const pageCount = Math.max(1, Math.ceil(sorted.length / table.pageSize))
  const safePage = Math.min(table.page, pageCount - 1)
  const pageRows = useMemo(
    () => sorted.slice(safePage * table.pageSize, safePage * table.pageSize + table.pageSize),
    [sorted, safePage, table.pageSize],
  )
  const range = pageRange(safePage, table.pageSize, sorted.length)

  useEffect(() => {
    setDetailRow(null)
  }, [namespace])

  useEffect(() => {
    if (table.page !== safePage) table.setPage(safePage)
  }, [safePage, table.page, table.setPage])

  useEffect(() => {
    table.setPage(0)
    // Filter values are intentionally the only triggers here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table.debouncedSearch, table.from, table.to])

  const visibleIds = pageRows.map(getRowId)
  const selectedVisible = visibleIds.filter((id) => table.selected.has(id))
  const allSelected = visibleIds.length > 0 && selectedVisible.length === visibleIds.length
  const someSelected = selectedVisible.length > 0 && !allSelected

  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = someSelected
  }, [someSelected])

  useEscape(Boolean(detailRow), () => setDetailRow(null))

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const typing = target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)
      if (typing) return
      if (event.key === '/') {
        event.preventDefault()
        searchRef.current?.focus()
      }
      if (event.key.toLowerCase() === 'r' && !event.ctrlKey && !event.metaKey && onRefresh) {
        if (online) onRefresh()
        else enqueueRefresh({ id: `refresh:${namespace}`, label: `${caption} refresh`, run: onRefresh })
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onRefresh, online, enqueueRefresh, namespace, caption])

  const visibleColumns = columns.filter((column) => !table.hiddenColumns.includes(column.key))
  const statusOptions = useMemo(
    () => [...new Set(safeRows.map((row) => getStatus?.(row)).filter((value): value is string => Boolean(value)))].sort(),
    [safeRows, getStatus],
  )
  const selectedRows = safeRows.filter((row) => table.selected.has(getRowId(row)))
  const exportColumns = columns.map((column) => ({
    key: column.key,
    label: column.label,
    value: (row: T) => column.exportValue?.(row) ?? '',
  }))

  function exportRows(format: 'csv' | 'json', onlySelected: boolean) {
    const target = onlySelected ? selectedRows : sorted
    if (target.length === 0) {
      notify('There are no rows to export.', 'info')
      return
    }
    const contents = format === 'csv' ? toCsv(target, exportColumns) : toJson(target, exportColumns)
    downloadText(`${namespace}-${new Date().toISOString().slice(0, 10)}.${format}`, contents, format === 'csv' ? 'text/csv;charset=utf-8' : 'application/json')
    notify(`${target.length} row${target.length === 1 ? '' : 's'} exported as ${format.toUpperCase()}.`)
  }

  async function copyIds() {
    const ids = selectedRows.map(getRowId).join(', ')
    const ok = await copyText(ids)
    notify(ok ? 'Row IDs copied.' : 'Clipboard is unavailable in this browser.', ok ? 'success' : 'error')
  }

  function toggleAll() {
    if (allSelected) {
      table.setSelected(visibleIds.filter((id) => !table.selected.has(id)))
    } else {
      table.setSelected([...new Set([...table.selected, ...visibleIds])])
    }
  }

  return (
    <div className="fp-table-section">
      <div className="fp-table-toolbar">
        <div className="fp-toolbar-left">
          <label className="fp-search">
            <Search size={14} aria-hidden="true" />
            <span className="sr-only">Search {caption}</span>
            <input
              ref={searchRef}
              value={table.search}
              onChange={(event) => table.setSearch(event.target.value)}
              placeholder={`Search ${caption.toLowerCase()}…`}
              aria-label={`Search ${caption}`}
            />
          </label>
          {getStatus ? (
            <label className="fp-compact-field">
              <span className="sr-only">Filter by status</span>
              <select className="field-input select-input" value={table.status} onChange={(event) => table.setStatus(event.target.value)}>
                <option value="">All statuses</option>
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option.replaceAll('_', ' ')}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {getDate ? (
            <div className="fp-date-range">
              <label>
                <span className="sr-only">From date</span>
                <input type="date" value={table.from} onChange={(event) => table.setFrom(event.target.value)} aria-label="From date" />
              </label>
              <span aria-hidden="true">–</span>
              <label>
                <span className="sr-only">To date</span>
                <input type="date" value={table.to} onChange={(event) => table.setTo(event.target.value)} aria-label="To date" />
              </label>
            </div>
          ) : null}
        </div>
        <div className="fp-toolbar-right">
          {toolbar}
          <details className="fp-menu">
            <summary className="btn btn-secondary" aria-label="Column and display options">
              <SlidersHorizontal aria-hidden="true" /> Options
            </summary>
            <div className="fp-menu-body">
              <p className="fp-menu-title">Density</p>
              <div className="fp-segmented">
                <button type="button" className={clsx(table.density === 'comfortable' && 'is-active')} onClick={() => table.setDensity('comfortable')}>
                  Comfortable
                </button>
                <button type="button" className={clsx(table.density === 'compact' && 'is-active')} onClick={() => table.setDensity('compact')}>
                  Compact
                </button>
              </div>
              <p className="fp-menu-title">Columns</p>
              {columns.filter((column) => column.optional).map((column) => (
                <label key={column.key} className="fp-toggle">
                  <input type="checkbox" checked={!table.hiddenColumns.includes(column.key)} onChange={() => table.toggleColumn(column.key)} />
                  {column.label}
                </label>
              ))}
              <label className="fp-compact-field fp-page-size">
                <span>Rows per page</span>
                <select
                  className="field-input select-input"
                  value={table.pageSize}
                  onChange={(event) => table.setPageSize(Number(event.target.value))}
                  aria-label="Rows per page"
                >
                  {[10, 25, 50, 100].map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </label>
            </div>
          </details>
        </div>
      </div>

      {duplicates.length > 0 ? (
        <p className="fp-inline-warning" role="status">
          <CircleAlert size={13} aria-hidden="true" />
          {duplicates.length} duplicate record id{duplicates.length === 1 ? '' : 's'} detected and hidden from the table.
        </p>
      ) : null}

      {table.selected.size > 0 ? (
        <div className="fp-bulk-bar" role="region" aria-label="Bulk actions">
          <span><strong>{table.selected.size}</strong> selected</span>
          <button type="button" className="btn btn-secondary" onClick={() => void copyIds()}>
            <Clipboard aria-hidden="true" /> Copy IDs
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => exportRows('csv', true)}>
            <FileSpreadsheet aria-hidden="true" /> CSV
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => exportRows('json', true)}>
            <FileJson aria-hidden="true" /> JSON
          </button>
          <button type="button" className="btn btn-ghost" onClick={table.clearSelection}>
            <X aria-hidden="true" /> Clear
          </button>
        </div>
      ) : null}

      {loading ? (
        <SkeletonRows columns={visibleColumns.length + 1} />
      ) : error ? (
        <div className="fp-table-state" role="alert">
          <CircleAlert aria-hidden="true" />
          <p>{error}</p>
          {onRetry ? (
            <button type="button" className="btn btn-secondary" onClick={onRetry}>
              <RefreshCw aria-hidden="true" /> Try again
            </button>
          ) : null}
        </div>
      ) : pageRows.length === 0 ? (
        <div className="fp-table-state">
          <Info aria-hidden="true" />
          <p><strong>{emptyTitle}</strong></p>
          <p className="fp-muted">{emptyDetail}</p>
          <button type="button" className="btn btn-secondary" onClick={table.resetFilters}>
            Clear filters
          </button>
        </div>
      ) : (
        <>
          <div className={clsx('data-table-wrap fp-table-viewport', table.density === 'compact' && 'is-compact')}>
            <table className="data-table fp-table">
              <caption className="sr-only">{caption}</caption>
              <thead>
                <tr>
                  <th scope="col" className="fp-check-cell">
                    <input
                      ref={selectAllRef}
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      aria-label={`Select all ${caption} on this page`}
                    />
                  </th>
                  {visibleColumns.map((column) => {
                    const isSorted = table.sortKey === column.key
                    const ariaSort: 'ascending' | 'descending' | 'none' = isSorted
                      ? table.sortDirection === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                    return (
                      <th key={column.key} scope="col" aria-sort={ariaSort}>
                        {column.sortValue || column.exportValue ? (
                          <button type="button" className="fp-sort" onClick={() => table.toggleSort(column.key)}>
                            {column.label}
                            {isSorted ? (
                              table.sortDirection === 'asc' ? <ArrowUp size={12} aria-hidden="true" /> : <ArrowDown size={12} aria-hidden="true" />
                            ) : (
                              <Columns3 size={11} aria-hidden="true" />
                            )}
                          </button>
                        ) : (
                          column.label
                        )}
                      </th>
                    )
                  })}
                  {renderDetail ? <th scope="col" className="fp-action-cell">Details</th> : null}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row) => {
                  const id = getRowId(row)
                  return (
                    <tr
                      key={id}
                      className={clsx(table.selected.has(id) && 'is-selected')}
                      tabIndex={renderDetail ? 0 : undefined}
                      onClick={(event) => {
                        if (!renderDetail || (event.target as HTMLElement).closest('input, button, a')) return
                        setDetailRow(row)
                      }}
                      onKeyDown={(event) => {
                        if (!renderDetail || event.target !== event.currentTarget) return
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          setDetailRow(row)
                        }
                      }}
                      aria-label={renderDetail ? `Open details for ${detailTitle?.(row) ?? id}` : undefined}
                    >
                      <td className="fp-check-cell">
                        <input type="checkbox" checked={table.selected.has(id)} onChange={() => table.toggleRow(id)} aria-label={`Select row ${id}`} />
                      </td>
                      {visibleColumns.map((column) => (
                        <td key={column.key}>{column.render(row)}</td>
                      ))}
                      {renderDetail ? (
                        <td className="fp-action-cell">
                          <button type="button" className="btn btn-secondary fp-row-action" onClick={() => setDetailRow(row)} aria-label={detailTitle ? `View ${detailTitle(row)}` : 'View row details'}>
                            <Eye aria-hidden="true" />
                            <span className="sr-only">View details</span>
                          </button>
                        </td>
                      ) : null}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="fp-cards">
            {pageRows.map((row) => {
              const id = getRowId(row)
              const labelColumns = visibleColumns.filter((column) => column.cardLabel)
              return (
                <article key={id} className={clsx('fp-card', table.selected.has(id) && 'is-selected')}>
                  <div className="fp-card-head">
                    <label className="fp-card-select">
                      <input type="checkbox" checked={table.selected.has(id)} onChange={() => table.toggleRow(id)} aria-label={`Select row ${id}`} />
                      {labelColumns[0] ? labelColumns[0].render(row) : truncate(id, 18)}
                    </label>
                    <button type="button" className="btn btn-ghost fp-icon-button" onClick={() => void copyText(id).then((ok) => notify(ok ? 'Row ID copied.' : 'Clipboard unavailable.', ok ? 'success' : 'error'))} aria-label={`Copy row ID ${id}`}>
                      <Copy aria-hidden="true" />
                    </button>
                  </div>
                  <dl>
                    {visibleColumns.filter((column) => !column.cardLabel).map((column) => (
                      <div key={column.key}>
                        <dt>{column.label}</dt>
                        <dd>{column.render(row)}</dd>
                      </div>
                    ))}
                  </dl>
                  {renderDetail ? (
                    <button type="button" className="btn btn-secondary btn-block" onClick={() => setDetailRow(row)}>
                      View details <ArrowUp aria-hidden="true" />
                    </button>
                  ) : null}
                </article>
              )
            })}
          </div>

          <a className="fp-skip-pagination" href={`#${namespace}-first-row`}>
            Skip pagination
          </a>
          <div className="pagination">
            <span>
              Showing {range.start}–{range.end} of {sorted.length} {caption.toLowerCase()}
              {!online ? ' · offline copy' : ''}
            </span>
            <div className="pagination-actions">
              <button type="button" className="btn btn-secondary" onClick={() => table.setPage(safePage - 1)} disabled={safePage === 0} aria-label="Previous page">
                Previous
              </button>
              <span className="pagination-count">{safePage + 1} / {pageCount}</span>
              <button type="button" className="btn btn-secondary" onClick={() => table.setPage(safePage + 1)} disabled={safePage + 1 >= pageCount} aria-label="Next page">
                Next
              </button>
            </div>
          </div>
          <div className="fp-table-footer">
            <button type="button" className="link-button" onClick={() => exportRows('csv', false)}>
              <Download aria-hidden="true" /> Export CSV
            </button>
            <button type="button" className="link-button" onClick={() => exportRows('json', false)}>
              <Download aria-hidden="true" /> Export JSON
            </button>
          </div>
          <span id={`${namespace}-first-row`} className="sr-only" tabIndex={-1}>
            Start of {caption} rows
          </span>
        </>
      )}

      {renderDetail && detailRow ? (
        <Drawer open title={detailTitle?.(detailRow) ?? 'Record details'} onClose={() => setDetailRow(null)}>
          {renderDetail(detailRow)}
          <div className="fp-drawer-actions">
            <button type="button" className="btn btn-secondary" onClick={() => void copyText(getRowId(detailRow)).then(() => notify('Row ID copied.'))}>
              <Copy aria-hidden="true" /> Copy ID
            </button>
          </div>
        </Drawer>
      ) : null}
    </div>
  )
}

/* ── Error boundary ──────────────────────────────────────────────────────── */

interface BoundaryState {
  error: Error | null
}

export class ErrorBoundary extends Component<{ children: ReactNode }, BoundaryState> {
  state: BoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Portal render error', error, info.componentStack)
  }

  render(): ReactNode {
    if (!this.state.error) return this.props.children
    return (
      <main id="main-content" className="fp-boundary" role="alert">
        <CircleAlert aria-hidden="true" />
        <h1>This page could not be displayed</h1>
        <p>{this.state.error.message || 'An unexpected error occurred.'}</p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            clearFeatureCache()
            this.setState({ error: null })
          }}
        >
          <RefreshCw aria-hidden="true" /> Reset this page
        </button>
        <Link to="/" className="btn btn-secondary">Return to overview</Link>
      </main>
    )
  }
}

/* ── Command catalogue helper ────────────────────────────────────────────── */

export function portalCommands(onRefresh: () => void, onExit: () => void): PaletteCommand[] {
  const commands: PaletteCommand[] = appConfig.nav.map((item) => ({
    id: `nav:${item.path}`,
    label: item.label,
    hint: item.endpoint,
    path: item.path,
  }))
  commands.push(
    { id: 'features', label: 'Feature guide', hint: 'All 100 portal features', path: '/features' },
    { id: 'shortcuts', label: 'Keyboard shortcuts', hint: '?', action: () => window.dispatchEvent(new Event('ll_hotel:shortcuts')) },
    { id: 'refresh', label: 'Refresh page data', hint: 'R', action: onRefresh },
    { id: 'exit', label: 'Exit safely', hint: 'Sign out and clear local data', action: onExit },
  )
  return commands
}

export function featureGuideEntryCount(): number {
  return assertFeatureCatalog() ? FEATURES.length : 0
}

export function findFeature(id: number): FeatureEntry | undefined {
  return FEATURES.find((feature) => feature.id === id)
}

export function featureAreas() {
  return FEATURE_AREAS
}

export function featureSearch(query: string) {
  return searchFeatures(query)
}

export function localNavigationLabel(path: string): string {
  const match = appConfig.nav.find((item) => item.path === path)
  if (match) return match.label
  if (path === '/features') return 'Feature guide'
  if (path === '/about') return 'About this portal'
  if (path === '/login') return 'Sign in'
  if (path === '/register') return 'Registration'
  return appConfig.title
}

/** Used by the mobile drawer trigger. */
export function MenuButton({ onClick, open }: { onClick: () => void; open: boolean }) {
  return (
    <button type="button" className="btn btn-ghost fp-icon-button fp-menu-button" onClick={onClick} aria-label={open ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={open}>
      <Menu aria-hidden="true" />
    </button>
  )
}

export function useOnline(): boolean {
  return useOnlineStatus()
}

export function sessionExpiryFromToken(token: string | null): number | null {
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

export function useExpiryWarning(expiresAt: number | null): boolean {
  return useSessionWarning(expiresAt)
}

export function escapeCsv(value: string): string {
  return csvCell(value)
}

export function stableSortDirection(current: SortDirection): SortDirection {
  return current === 'asc' ? 'desc' : 'asc'
}

export function formatCount(value: number): string {
  return formatNumber(value)
}

export function keyboardIcon() {
  return <Keyboard aria-hidden="true" />
}

export function commandIcon() {
  return <Command aria-hidden="true" />
}
