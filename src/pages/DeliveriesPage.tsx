import { useState } from 'react'
import { formatDate, pieces, useQuery } from '../api/hooks'
import { PageHeader, Pagination, StateBox, StatusChip, Table } from '../ui/kit'

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

const PAGE_SIZE = 50
const STATUSES = ['DELIVERED', 'PARTIALLY_DELIVERED', 'CANCELLED']

export function DeliveriesPage() {
  const [page, setPage] = useState(0)
  const [status, setStatus] = useState('')
  const { data, error, loading, reload } = useQuery<Response>('/client-portal/deliveries', {
    skip: page * PAGE_SIZE,
    limit: PAGE_SIZE,
    status: status || undefined,
  })

  return (
    <>
      <PageHeader
        title="Deliveries"
        subtitle="What came back, and whether anything was short"
      />

      <div className="panel panel-pad mb-4">
        <label className="block max-w-xs">
          <span className="field-label">Filter by status</span>
          <select
            className="field-input select-input"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value)
              setPage(0)
            }}
            aria-label="Filter deliveries by status"
          >
            <option value="">All statuses</option>
            {STATUSES.map((value) => (
              <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>
            ))}
          </select>
        </label>
      </div>

      <StateBox
        loading={loading}
        error={error}
        empty={!loading && !error && (data?.items.length ?? 0) === 0}
        onRetry={reload}
        emptyTitle={status ? 'No deliveries with that status' : 'No deliveries yet'}
        emptyDetail={status ? 'Choose a different status to see more records.' : 'Returned items will appear here once they are delivered.'}
      >
        <Table head={['Delivered', 'Pieces', 'Handed over by', 'Signed for by', 'Corrections', 'Status']}>
          {(data?.items ?? []).map((delivery) => (
            <tr key={delivery.id}>
              <td className="px-4 py-3 font-medium">{formatDate(delivery.delivery_date)}</td>
              <td className="px-4 py-3 tabular-nums">{pieces(delivery.items)}</td>
              <td className="px-4 py-3 text-slate-600">{delivery.delivered_by || '—'}</td>
              <td className="px-4 py-3 text-slate-600">{delivery.received_by || '—'}</td>
              <td className="px-4 py-3 tabular-nums">
                {delivery.corrections.length > 0 ? (
                  <span className="font-semibold text-amber-700">{delivery.corrections.length}</span>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </td>
              <td className="px-4 py-3"><StatusChip status={delivery.status} /></td>
            </tr>
          ))}
        </Table>
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={data?.total ?? 0}
          onPage={setPage}
          label="deliveries"
        />
      </StateBox>
    </>
  )
}
