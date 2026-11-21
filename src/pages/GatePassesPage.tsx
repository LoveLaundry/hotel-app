import { useState } from 'react'
import { formatDate, pieces, useQuery } from '../api/hooks'
import { PageHeader, Pagination, StateBox, StatusChip, Table } from '../ui/kit'

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

const PAGE_SIZE = 50
const STATUSES = ['RECEIVED', 'PROCESSING', 'READY_FOR_DELIVERY', 'PARTIALLY_DELIVERED', 'DELIVERED', 'CANCELLED']

export function GatePassesPage() {
  const [page, setPage] = useState(0)
  const [status, setStatus] = useState('')
  const { data, error, loading, reload } = useQuery<Response>('/client-portal/gate-passes', {
    skip: page * PAGE_SIZE,
    limit: PAGE_SIZE,
    status: status || undefined,
  })

  return (
    <>
      <PageHeader
        title="Gate passes"
        subtitle="Every collection taken from your property, newest first"
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
            aria-label="Filter gate passes by status"
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
        emptyTitle={status ? 'No gate passes with that status' : 'No gate passes yet'}
        emptyDetail={status ? 'Choose a different status to see more records.' : 'Collections from your property will appear here.'}
      >
        <Table head={['Gate pass', 'Received', 'Collected by', 'Pieces', 'Status']}>
          {(data?.items ?? []).map((pass) => (
            <tr key={pass.id}>
              <td className="px-4 py-3 font-medium">{pass.gate_pass_number}</td>
              <td className="px-4 py-3 text-slate-600">{formatDate(pass.receiving_date)}</td>
              <td className="px-4 py-3 text-slate-600">{pass.received_by || '—'}</td>
              <td className="px-4 py-3 tabular-nums">{pieces(pass.items)}</td>
              <td className="px-4 py-3"><StatusChip status={pass.status} /></td>
            </tr>
          ))}
        </Table>
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={data?.total ?? 0}
          onPage={setPage}
          label="gate passes"
        />
      </StateBox>
    </>
  )
}
