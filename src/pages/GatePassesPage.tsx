import { formatDate, useQuery } from '../api/hooks'
import { aggregateNestedItems, formatNumber, pieces } from '../features/feature-pack/utils'
import {
  DataFreshness,
  FeatureTable,
  RefreshButton,
  TruncatedText,
} from '../features/feature-pack/components'
import { PageHeader, StatusChip } from '../ui/kit'

interface GatePass {
  id: string
  gate_pass_number: string
  receiving_date: string
  received_by: string
  status: string
  items: unknown[]
}

interface Response {
  total: number
  items: GatePass[]
}

export function GatePassesPage() {
  const { data, error, loading, updating, lastUpdated, truncated, reload } = useQuery<Response>('/client-portal/gate-passes', {
    skip: 0,
    limit: 500,
  })
  const rows = data?.items ?? []

  return (
    <>
      <PageHeader
        title="Gate passes"
        subtitle="Every collection taken from your property, newest first"
      />

      <div className="fp-table-toolbar" style={{ marginBottom: '0.9rem' }}>
        <DataFreshness at={lastUpdated} loading={updating} />
        <RefreshButton onRefresh={reload} label="Refresh gate passes" />
      </div>

      {truncated ? (
        <p className="fp-inline-warning" role="status">
          More than 500 gate passes exist. Showing the most recent 500; refine the search to narrow them.
        </p>
      ) : null}

      <FeatureTable
        namespace="gate-passes"
        caption="Gate passes"
        rows={rows}
        loading={loading}
        error={error}
        onRetry={reload}
        onRefresh={reload}
        getRowId={(row) => row.id}
        getStatus={(row) => row.status}
        getDate={(row) => row.receiving_date}
        searchText={(row) => [row.gate_pass_number, row.received_by, row.status]}
        detailTitle={(row) => `Gate pass ${row.gate_pass_number}`}
        renderDetail={(row) => {
          const totals = aggregateNestedItems(row)
          return (
            <div className="fp-detail-grid">
              <div><span>Pass number</span><strong>{row.gate_pass_number}</strong></div>
              <div><span>Received</span><strong>{formatDate(row.receiving_date)}</strong></div>
              <div><span>Collected by</span><strong>{row.received_by || '—'}</strong></div>
              <div><span>Status</span><StatusChip status={row.status} /></div>
              <div><span>Pieces</span><strong>{formatNumber(totals.pieces)}</strong></div>
              <div><span>Line items</span><strong>{formatNumber(totals.lines)}</strong></div>
              {Object.entries(totals.categories).map(([category, count]) => (
                <div key={category}><span>{category}</span><strong>{formatNumber(count)}</strong></div>
              ))}
            </div>
          )
        }}
        columns={[
          {
            key: 'number',
            label: 'Gate pass',
            cardLabel: true,
            render: (row) => <TruncatedText value={row.gate_pass_number} max={24} />,
            exportValue: (row) => row.gate_pass_number,
            sortValue: (row) => row.gate_pass_number,
          },
          {
            key: 'received',
            label: 'Received',
            render: (row) => formatDate(row.receiving_date),
            exportValue: (row) => row.receiving_date,
            sortValue: (row) => row.receiving_date,
          },
          {
            key: 'collected',
            label: 'Collected by',
            optional: true,
            render: (row) => row.received_by || '—',
            exportValue: (row) => row.received_by,
            sortValue: (row) => row.received_by,
          },
          {
            key: 'pieces',
            label: 'Pieces',
            render: (row) => formatNumber(pieces(row.items)),
            exportValue: (row) => pieces(row.items),
            sortValue: (row) => pieces(row.items),
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
