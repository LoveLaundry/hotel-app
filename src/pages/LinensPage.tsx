import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, X } from 'lucide-react'
import { formatDate, useQuery } from '../api/hooks'
import { Notice, PageHeader, Panel, StateBox, StatusChip, Table } from '../ui/kit'

interface Linen {
  id: string
  linen_id: string
  category?: string
  item_type?: string
  description?: string
  status?: string
  condition?: string
  wash_count?: number
  last_scanned_date?: string | null
  updated_at?: string | null
}

interface Response {
  total: number
  items: Linen[]
}

interface ScanEvent {
  action?: string
  from_status?: string
  to_status?: string
  user?: string
  timestamp?: string | null
}

function ScanHistory({ code, onClose }: { code: string; onClose: () => void }) {
  const { data, error, status, loading, reload } = useQuery<{ linen_id: string; events: ScanEvent[] }>(
    `/client-portal/linens/${code}/events`,
  )

  return (
    <Panel className="mt-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="panel-title">Scan history</p>
          <p className="panel-note">Tag {code} · newest movement first</p>
        </div>
        <button type="button" onClick={onClose} className="btn btn-secondary" aria-label="Close scan history">
          <X />
          Close
        </button>
      </div>

      {loading ? <p className="text-sm text-slate-500">Loading…</p> : null}
      {status === 404 ? (
        <p className="text-sm text-slate-500">
          Scan history is not available for this tag yet. It will appear once the first movement is recorded.
        </p>
      ) : error && status !== 404 ? (
        <Notice tone="danger" title="History could not be loaded" action={<button type="button" className="btn btn-secondary" onClick={reload}>Try again</button>}>
          {error}
        </Notice>
      ) : null}
      {data && data.events.length === 0 && !loading ? (
        <p className="text-sm text-slate-500">No scans recorded for this tag yet.</p>
      ) : null}
      {data && data.events.length > 0 ? (
        <ul className="divide-y divide-slate-100">
          {data.events.map((evt, i) => (
            <li key={`${evt.timestamp ?? 'event'}-${i}`} className="flex flex-wrap items-center justify-between gap-3 py-2 text-sm">
              <span className="font-medium">{evt.action}</span>
              <span className="text-slate-500">
                {evt.from_status} → {evt.to_status}
                {evt.user ? ` · ${evt.user}` : ''}
              </span>
              <span className="text-slate-400">{evt.timestamp ? formatDate(evt.timestamp) : ''}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </Panel>
  )
}

export function LinensPage() {
  const [selected, setSelected] = useState<string | null>(null)
  const [filter, setFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const { data, error, status, loading, reload } = useQuery<Response>('/client-portal/linens')

  const rows = useMemo(() => {
    const needle = filter.trim().toLowerCase()
    return (data?.items ?? []).filter((linen) => {
      if (statusFilter && (linen.status ?? '').toUpperCase() !== statusFilter) return false
      if (!needle) return true
      return [linen.linen_id, linen.item_type, linen.description, linen.category]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    })
  }, [data, filter, statusFilter])

  const statuses = useMemo(
    () => [...new Set((data?.items ?? []).map((linen) => linen.status).filter(Boolean))].sort(),
    [data],
  )

  function toggle(code: string) {
    setSelected((current) => (current === code ? null : code))
  }

  return (
    <>
      <PageHeader
        title="Linen tags"
        subtitle="Your tagged linen with live status — select a tag to see every movement"
      />

      {status === 404 ? (
        <Notice
          title="Linen tracking is being enabled"
          action={<button type="button" className="btn btn-secondary" onClick={reload}>Try again</button>}
        >
          Tag history is not available in this portal yet. Gate passes, deliveries and invoices are unaffected —
          check back shortly or contact your platform administrator.
        </Notice>
      ) : (
        <>
          <div className="panel panel-pad mb-4">
            <div className="flex flex-wrap items-end gap-3">
              <label className="min-w-[14rem] flex-1">
                <span className="field-label">Search tags</span>
                <input
                  className="field-input"
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                  placeholder="Tag number, item or category"
                  aria-label="Search linen tags"
                />
              </label>
              <label className="min-w-[11rem]">
                <span className="field-label">Status</span>
                <select
                  className="field-input select-input"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  aria-label="Filter linen tags by status"
                >
                  <option value="">All statuses</option>
                  {statuses.map((value) => (
                    <option key={String(value)} value={String(value).toUpperCase()}>
                      {String(value).replaceAll('_', ' ')}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <StateBox
            loading={loading}
            error={error}
            empty={!loading && !error && rows.length === 0}
            onRetry={reload}
            emptyTitle={data?.items.length ? 'No tags match those filters' : 'No linen tags yet'}
            emptyDetail={data?.items.length ? 'Clear the search or status filter to see all tags.' : 'Tags issued to your property will appear here.'}
          >
            <Table head={['Tag', 'Item', 'Status', 'Condition', 'Washes', 'Last scan']}>
              {rows.map((linen) => {
                const isOpen = selected === linen.linen_id
                return (
                  <tr key={linen.id} className={isOpen ? 'is-selected' : ''}>
                    <td className="px-4 py-3 font-mono font-medium">
                      <button
                        type="button"
                        className="link-button"
                        aria-expanded={isOpen}
                        onClick={() => toggle(linen.linen_id)}
                      >
                        {isOpen ? <ChevronDown size={14} aria-hidden="true" /> : <ChevronRight size={14} aria-hidden="true" />}
                        {linen.linen_id}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {[linen.item_type, linen.description].filter(Boolean).join(' — ') || linen.category || '—'}
                    </td>
                    <td className="px-4 py-3"><StatusChip status={linen.status ?? ''} /></td>
                    <td className="px-4 py-3 text-slate-600">{linen.condition || '—'}</td>
                    <td className="px-4 py-3 tabular-nums">{linen.wash_count ?? 0}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {linen.last_scanned_date ? formatDate(linen.last_scanned_date) : '—'}
                    </td>
                  </tr>
                )
              })}
            </Table>
            {data ? (
              <p className="mt-3 text-xs text-slate-500">
                Showing {rows.length} of {data.total} tags.
              </p>
            ) : null}
          </StateBox>

          {selected ? <ScanHistory code={selected} onClose={() => setSelected(null)} /> : null}
        </>
      )}
    </>
  )
}
