import { useState } from 'react'
import { formatDate, useQuery } from '../api/hooks'
import { PageHeader, StateBox, StatusChip, Table } from '../ui/kit'

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
  const { data, error, loading } = useQuery<{ linen_id: string; events: ScanEvent[] }>(
    `/client-portal/linens/${code}/events`,
  )
  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="mb-2 text-sm font-semibold">Scan history — {code}</h3>
      {loading && <p className="text-sm text-slate-500">Loading…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {data && data.events.length === 0 && (
        <p className="text-sm text-slate-500">No scans recorded for this tag yet.</p>
      )}
      {data && data.events.length > 0 && (
        <ul className="divide-y divide-slate-100">
          {data.events.map((evt, i) => (
            <li key={i} className="flex items-center justify-between gap-3 py-2 text-sm">
              <span className="font-medium">{evt.action}</span>
              <span className="text-slate-500">
                {evt.from_status} → {evt.to_status}
                {evt.user ? ` · ${evt.user}` : ''}
              </span>
              <span className="text-slate-400">{evt.timestamp ? formatDate(evt.timestamp) : ''}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function LinensPage() {
  const [selected, setSelected] = useState<string | null>(null)
  const { data, error, loading, reload } = useQuery<Response>('/client-portal/linens')

  return (
    <>
      <PageHeader
        title="Linen tags"
        subtitle="Your tagged linen with live status — tap a tag to see every movement"
      />

      <StateBox loading={loading} error={error} empty={data?.items.length === 0} onRetry={reload}>
        <Table head={['Tag', 'Item', 'Status', 'Condition', 'Washes', 'Last scan']}>
          {(data?.items ?? []).map((linen) => (
            <tr
              key={linen.id}
              className={`hover:bg-slate-50 cursor-pointer ${selected === linen.linen_id ? 'bg-blue-50' : ''}`}
              onClick={() => setSelected(selected === linen.linen_id ? null : linen.linen_id ?? null)}
            >
              <td className="px-4 py-3 font-mono font-medium">{linen.linen_id}</td>
              <td className="px-4 py-3 text-slate-600">
                {[linen.item_type, linen.description].filter(Boolean).join(' — ') || linen.category || '—'}
              </td>
              <td className="px-4 py-3"><StatusChip status={linen.status ?? ''} /></td>
              <td className="px-4 py-3 text-slate-600">{linen.condition || '—'}</td>
              <td className="px-4 py-3 tabular-nums">{linen.wash_count ?? 0}</td>
              <td className="px-4 py-3 text-slate-600">{linen.last_scanned_date ? formatDate(linen.last_scanned_date) : '—'}</td>
            </tr>
          ))}
        </Table>
      </StateBox>

      {selected && <ScanHistory code={selected} />}
    </>
  )
}
