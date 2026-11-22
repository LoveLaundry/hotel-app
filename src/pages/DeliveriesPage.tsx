import { formatDate, useQuery } from '../api/hooks'
import { aggregateNestedItems, formatNumber, normalizeItems, pieces } from '../features/feature-pack/utils'
import {
  DataFreshness,
  FeatureTable,
  RefreshButton,
  TruncatedText,
} from '../features/feature-pack/components'
import { PageHeader, StatusChip } from '../ui/kit'

interface Delivery {
  id: string
  delivery_date: string
  delivered_by: string
  received_by: string
  status: string
  items: unknown[]
  corrections: unknown[]
}

interface Response {
  total: number
  items: Delivery[]
}

export function DeliveriesPage() {
  const { data, error, loading, updating, lastUpdated, truncated, reload } = useQuery<Response>('/client-portal/deliveries', {
    skip: 0,
    limit: 500,
  })
  const rows = data?.items ?? []

  return (
    <>
      <PageHeader
        title="Deliveries"
        subtitle="What came back, and whether anything was short"
      />

      <div className="fp-table-toolbar" style={{ marginBottom: '0.9rem' }}>
        <DataFreshness at={lastUpdated} loading={updating} />
        <RefreshButton onRefresh={reload} label="Refresh deliveries" />
      </div>

      {truncated ? (
        <p className="fp-inline-warning" role="status">
          Showing the first 500 deliveries only. Search by name or date to narrow the list.
        </p>
      ) : null}

      <FeatureTable
        namespace="deliveries"
        caption="Deliveries"
        rows={rows}
        loading={loading}
        error={error}
        onRetry={reload}
        onRefresh={reload}
        getRowId={(row) => row.id}
        getStatus={(row) => row.status}
        getDate={(row) => row.delivery_date}
        searchText={(row) => [row.delivered_by, row.received_by, row.status, row.delivery_date]}
        detailTitle={(row) => `Delivery ${formatDate(row.delivery_date)}`}
        renderDetail={(row) => {
          const totals = aggregateNestedItems(row)
          const corrections = normalizeItems<Record<string, unknown>>(row.corrections)
          return (
            <div className="fp-detail-grid">
              <div><span>Delivered</span><strong>{formatDate(row.delivery_date)}</strong></div>
              <div><span>Handed over by</span><strong>{row.delivered_by || '—'}</strong></div>
              <div><span>Signed for by</span><strong>{row.received_by || '—'}</strong></div>
              <div><span>Status</span><StatusChip status={row.status} /></div>
              <div><span>Pieces</span><strong>{formatNumber(totals.pieces)}</strong></div>
              <div><span>Corrections</span><strong>{formatNumber(corrections.length)}</strong></div>
              {corrections.map((correction, index) => (
                <div key={`${String(correction.id ?? index)}`} className="fp-detail-wide">
                  <span>Correction {index + 1}</span>
                  <strong>{String(correction.note ?? correction.reason ?? correction.status ?? 'Recorded')}</strong>
                </div>
              ))}
            </div>
          )
        }}
        columns={[
          {
            key: 'date',
            label: 'Delivered',
            cardLabel: true,
            render: (row) => formatDate(row.delivery_date),
            exportValue: (row) => row.delivery_date,
            sortValue: (row) => row.delivery_date,
          },
          {
            key: 'pieces',
            label: 'Pieces',
            render: (row) => formatNumber(pieces(row.items)),
            exportValue: (row) => pieces(row.items),
            sortValue: (row) => pieces(row.items),
          },
          {
            key: 'handed',
            label: 'Handed over by',
            optional: true,
            render: (row) => <TruncatedText value={row.delivered_by || '—'} max={22} />,
            exportValue: (row) => row.delivered_by,
            sortValue: (row) => row.delivered_by,
          },
          {
            key: 'signed',
            label: 'Signed for by',
            optional: true,
            render: (row) => <TruncatedText value={row.received_by || '—'} max={22} />,
            exportValue: (row) => row.received_by,
            sortValue: (row) => row.received_by,
          },
          {
            key: 'corrections',
            label: 'Corrections',
            render: (row) => {
              const count = normalizeItems(row.corrections).length
              return count > 0 ? <span className="fp-count-warning">{count}</span> : <span className="text-slate-400">—</span>
            },
            exportValue: (row) => normalizeItems(row.corrections).length,
            sortValue: (row) => normalizeItems(row.corrections).length,
          },
          {
            key: 'status',
            label: 'Status',
            render: (row) => <StatusChip status={row.status} />,
            exportValue: (row) => row.status,
            sortValue: (row) => row.status,
          },
        ]}
      />
    </>
  )
}
