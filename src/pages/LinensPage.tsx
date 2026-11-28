import { formatDate, useQuery } from '../api/hooks'
import { LiveTag } from '../components/LiveTag'
import { formatNumber } from '../features/feature-pack/utils'
import {
  DataFreshness,
  FeatureTable,
  RefreshButton,
  TruncatedText,
} from '../features/feature-pack/components'
import { Notice, PageHeader, StatusChip } from '../ui/kit'

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

function ScanHistory({ code }: { code: string }) {
  const { data, error, status, loading, reload } = useQuery<{ linen_id: string; events: ScanEvent[] }>(
    `/client-portal/linens/${code}/events`,
  )
  if (loading) return <p className="text-sm text-slate-500">Loading scan history…</p>
  if (status === 404) {
    return (
      <p className="text-sm text-slate-500">
        Scan history is not available for this tag yet. It will appear once the first movement is recorded.
      </p>
    )
  }
  if (error) {
    return (
      <Notice tone="danger" title="History could not be loaded" action={<button type="button" className="btn btn-secondary" onClick={reload}>Try again</button>}>
        {error}
      </Notice>
    )
  }
  const events = data?.events ?? []
  if (events.length === 0) return <p className="text-sm text-slate-500">No scans recorded for this tag yet.</p>
  return (
    <ul className="divide-y divide-slate-100">
      {events.map((evt, index) => (
        <li key={`${evt.timestamp ?? 'event'}-${index}`} className="flex flex-wrap items-center justify-between gap-3 py-2 text-sm">
          <span className="font-medium">{evt.action}</span>
          <span className="text-slate-500">
            {evt.from_status} → {evt.to_status}
            {evt.user ? ` · ${evt.user}` : ''}
          </span>
          <span className="text-slate-400">{evt.timestamp ? formatDate(evt.timestamp) : ''}</span>
        </li>
      ))}
    </ul>
  )
}

export function LinensPage() {
  const { data, error, status, loading, updating, lastUpdated, truncated, reload } = useQuery<Response>('/client-portal/linens', { limit: 500 })
  const rows = data?.items ?? []

  return (
    <>
      <PageHeader
        title="Linen tags"
        subtitle="Your tagged linen with live status — select a tag to see every movement"
      />

      <div className="fp-table-toolbar" style={{ marginBottom: '0.9rem' }}>
        <DataFreshness at={lastUpdated} loading={updating} />
        <RefreshButton onRefresh={reload} label="Refresh linen tags" />
      </div>

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
          {truncated ? (
            <p className="fp-inline-warning" role="status">
              Showing the first 500 tags. Search or filter to find a specific tag.
            </p>
          ) : null}

          <FeatureTable
            namespace="linens"
            caption="Linen tags"
            rows={rows}
            loading={loading}
            error={error}
            onRetry={reload}
            onRefresh={reload}
            getRowId={(row) => row.id}
            getStatus={(row) => row.status}
            getDate={(row) => row.last_scanned_date ?? row.updated_at}
            searchText={(row) => [row.linen_id, row.item_type, row.description, row.category, row.condition]}
            detailTitle={(row) => `Tag ${row.linen_id}`}
            renderDetail={(row) => (
              <div className="flex flex-col gap-3">
                <LiveTag linenId={row.linen_id} />
                <ScanHistory code={row.linen_id} />
              </div>
            )}
            columns={[
              {
                key: 'tag',
                label: 'Tag',
                cardLabel: true,
                render: (row) => <LiveTag linenId={row.linen_id} compact />,
                exportValue: (row) => row.linen_id,
                sortValue: (row) => row.linen_id,
              },
              {
                key: 'item',
                label: 'Item',
                render: (row) => <TruncatedText value={[row.item_type, row.description].filter(Boolean).join(' — ') || row.category || '—'} max={34} />,
                exportValue: (row) => [row.item_type, row.description].filter(Boolean).join(' — ') || row.category,
                sortValue: (row) => row.item_type ?? row.category ?? '',
              },
              {
                key: 'status',
                label: 'Status',
                render: (row) => <StatusChip status={row.status ?? ''} />,
                exportValue: (row) => row.status,
                sortValue: (row) => row.status,
              },
              {
                key: 'condition',
                label: 'Condition',
                optional: true,
                render: (row) => row.condition || '—',
                exportValue: (row) => row.condition,
                sortValue: (row) => row.condition,
              },
              {
                key: 'washes',
                label: 'Washes',
                render: (row) => formatNumber(row.wash_count ?? 0),
                exportValue: (row) => row.wash_count ?? 0,
                sortValue: (row) => row.wash_count ?? 0,
              },
              {
                key: 'scan',
                label: 'Last scan',
                render: (row) => (row.last_scanned_date ? formatDate(row.last_scanned_date) : '—'),
                exportValue: (row) => row.last_scanned_date,
                sortValue: (row) => row.last_scanned_date,
              },
            ]}
          />

          {data ? (
            <p className="mt-3 text-xs text-slate-500">
              Showing {rows.length} of {formatNumber(data.total)} tags
              {data.total > 500 ? ' (first 500 loaded)' : ''}.
            </p>
          ) : null}
        </>
      )}
    </>
  )
}
