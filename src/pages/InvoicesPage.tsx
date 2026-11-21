import { useState } from 'react'
import { Eye, X } from 'lucide-react'
import { dataApi, errorMessage } from '../api/client'
import { formatDate, formatMoney, useQuery } from '../api/hooks'
import { Notice, PageHeader, Pagination, Panel, StateBox, StatusChip, Table } from '../ui/kit'

interface Invoice {
  id: string
  manual_bill_number: string | null
  quotation_title: string | null
  created_at: string
  grand_total: number
  paid_amount: number
  balance: number
  payment_status: string
}

interface Response {
  total: number
  items: Invoice[]
}

interface InvoiceDetail extends Invoice {
  items: Array<Record<string, unknown>>
  total_amount?: number
  discounts: number
  transport_fee: number
  taxes: number
  additional_charges: number
  notes: string | null
}

const PAGE_SIZE = 50
const STATUSES = ['PENDING', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED']

export function InvoicesPage() {
  const [page, setPage] = useState(0)
  const [paymentStatus, setPaymentStatus] = useState('')
  const { data, error, loading, reload } = useQuery<Response>('/client-portal/bills', {
    skip: page * PAGE_SIZE,
    limit: PAGE_SIZE,
    payment_status: paymentStatus || undefined,
  })
  const [detail, setDetail] = useState<InvoiceDetail | null>(null)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [openingId, setOpeningId] = useState<string | null>(null)

  async function open(invoice: Invoice) {
    setOpeningId(invoice.id)
    setDetailError(null)
    try {
      const response = await dataApi.get<InvoiceDetail>(`/client-portal/bills/${invoice.id}`)
      setDetail(response.data)
    } catch (caught) {
      setDetailError(errorMessage(caught))
      setDetail(null)
    } finally {
      setOpeningId(null)
    }
  }

  return (
    <>
      <PageHeader title="Invoices" subtitle="What has been billed, what is settled" />

      <div className="panel panel-pad mb-4">
        <label className="block max-w-xs">
          <span className="field-label">Filter by payment status</span>
          <select
            className="field-input select-input"
            value={paymentStatus}
            onChange={(event) => {
              setPaymentStatus(event.target.value)
              setPage(0)
            }}
            aria-label="Filter invoices by payment status"
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
        emptyTitle={paymentStatus ? 'No invoices with that status' : 'No invoices yet'}
        emptyDetail={paymentStatus ? 'Choose a different status to see more records.' : 'Invoices raised by your provider will appear here.'}
      >
        <Table head={['Invoice', 'Date', 'Total', 'Paid', 'Balance', 'Status', '']}>
          {(data?.items ?? []).map((invoice) => (
            <tr key={invoice.id}>
              <td className="px-4 py-3 font-medium">
                {invoice.manual_bill_number || invoice.quotation_title || invoice.id.slice(-6)}
              </td>
              <td className="px-4 py-3 text-slate-600">{formatDate(invoice.created_at)}</td>
              <td className="px-4 py-3 tabular-nums">{formatMoney(invoice.grand_total)}</td>
              <td className="px-4 py-3 tabular-nums text-slate-600">{formatMoney(invoice.paid_amount)}</td>
              <td className="px-4 py-3 tabular-nums font-semibold">{formatMoney(invoice.balance)}</td>
              <td className="px-4 py-3"><StatusChip status={invoice.payment_status} /></td>
              <td className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => void open(invoice)}
                  disabled={openingId === invoice.id}
                  className="btn btn-secondary"
                  aria-label={`View invoice ${invoice.manual_bill_number || invoice.id.slice(-6)}`}
                >
                  <Eye />
                  {openingId === invoice.id ? 'Opening…' : 'View'}
                </button>
              </td>
            </tr>
          ))}
        </Table>
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={data?.total ?? 0}
          onPage={setPage}
          label="invoices"
        />
      </StateBox>

      {detailError ? (
        <div className="mt-4">
          <Notice tone="danger" title="Invoice detail could not be loaded">
            {detailError}
          </Notice>
        </div>
      ) : null}

      {detail ? (
        <Panel className="mt-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Invoice detail
              </p>
              <h2 className="mt-1 text-lg font-semibold">
                {detail.manual_bill_number || detail.quotation_title || detail.id}
              </h2>
              <p className="text-sm text-slate-500">{formatDate(detail.created_at)}</p>
            </div>
            <div className="text-right">
              <StatusChip status={detail.payment_status} />
              <p className="mt-2 text-lg font-semibold tabular-nums">
                {formatMoney(detail.balance)} due
              </p>
            </div>
          </div>

          <dl className="mt-5 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
            <Row label="Subtotal" value={formatMoney(detail.total_amount ?? detail.grand_total)} />
            <Row label="Discounts" value={formatMoney(-detail.discounts)} />
            <Row label="Transport" value={formatMoney(detail.transport_fee)} />
            <Row label="Taxes" value={formatMoney(detail.taxes)} />
            <Row label="Additional charges" value={formatMoney(detail.additional_charges)} />
            <Row label="Grand total" value={formatMoney(detail.grand_total)} strong />
            <Row label="Paid" value={formatMoney(detail.paid_amount)} />
            <Row label="Balance" value={formatMoney(detail.balance)} strong />
          </dl>

          {detail.notes ? (
            <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
              {detail.notes}
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => setDetail(null)}
            className="btn btn-secondary mt-5"
          >
            <X />
            Close
          </button>
        </Panel>
      ) : null}
    </>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between border-b border-slate-100 py-1">
      <dt className="text-slate-500">{label}</dt>
      <dd className={`tabular-nums ${strong ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
        {value}
      </dd>
    </div>
  )
}
