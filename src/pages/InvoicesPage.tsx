import { formatDate, formatMoney, useQuery } from '../api/hooks'
import { aggregateNestedItems, formatNumber, normalizeItems } from '../features/feature-pack/utils'
import {
  DataFreshness,
  FeatureTable,
  RefreshButton,
  SkeletonRows,
  TruncatedText,
} from '../features/feature-pack/components'
import { PageHeader, StateBox, StatusChip } from '../ui/kit'

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

function DetailRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="fp-detail-row">
      <span>{label}</span>
      <strong className={strong ? 'is-strong' : undefined}>{value}</strong>
    </div>
  )
}

function InvoiceDetailBody({ id }: { id: string }) {
  const { data, error, loading, reload } = useQuery<InvoiceDetail>(`/client-portal/bills/${id}`)
  return (
    <StateBox loading={loading} error={error} onRetry={reload}>
      {loading ? <SkeletonRows columns={2} rows={6} /> : data ? (
        <div className="fp-invoice-detail">
          <div className="fp-detail-grid">
            <div><span>Invoice</span><strong>{data.manual_bill_number || data.quotation_title || data.id}</strong></div>
            <div><span>Date</span><strong>{formatDate(data.created_at)}</strong></div>
            <div><span>Status</span><StatusChip status={data.payment_status} /></div>
            <div><span>Balance</span><strong>{formatMoney(data.balance)}</strong></div>
          </div>
          <div className="fp-detail-rows">
            <DetailRow label="Subtotal" value={formatMoney(data.total_amount ?? data.grand_total)} />
            <DetailRow label="Discounts" value={formatMoney(-(data.discounts ?? 0))} />
            <DetailRow label="Transport" value={formatMoney(data.transport_fee ?? 0)} />
            <DetailRow label="Taxes" value={formatMoney(data.taxes ?? 0)} />
            <DetailRow label="Additional charges" value={formatMoney(data.additional_charges ?? 0)} />
            <DetailRow label="Grand total" value={formatMoney(data.grand_total)} strong />
            <DetailRow label="Paid" value={formatMoney(data.paid_amount)} />
            <DetailRow label="Balance" value={formatMoney(data.balance)} strong />
          </div>
          <p className="fp-detail-note">Line items: {formatNumber(aggregateNestedItems(data).lines)} · Pieces: {formatNumber(aggregateNestedItems(data).pieces)}</p>
          {normalizeItems(data.items).length > 0 ? (
            <ul className="fp-detail-list">
              {normalizeItems<Record<string, unknown>>(data.items).map((item, index) => (
                <li key={`${String(item.id ?? index)}`}>
                  <span>{String(item.description ?? item.item_type ?? `Line ${index + 1}`)}</span>
                  <strong>{String(item.qty ?? item.quantity ?? item.client_qty ?? '—')}</strong>
                </li>
              ))}
            </ul>
          ) : null}
          {data.notes ? <p className="fp-detail-note">{data.notes}</p> : null}
        </div>
      ) : null}
    </StateBox>
  )
}

export function InvoicesPage() {
  const { data, error, loading, updating, lastUpdated, truncated, reload } = useQuery<Response>('/client-portal/bills', {
    skip: 0,
    limit: 500,
  })
  const rows = data?.items ?? []

  return (
    <>
      <PageHeader title="Invoices" subtitle="What has been billed, what is settled" />

      <div className="fp-table-toolbar" style={{ marginBottom: '0.9rem' }}>
        <DataFreshness at={lastUpdated} loading={updating} />
        <RefreshButton onRefresh={reload} label="Refresh invoices" />
      </div>

      {truncated ? (
        <p className="fp-inline-warning" role="status">
          Showing the first 500 invoices only. Use filters or search to narrow the list.
        </p>
      ) : null}

      <FeatureTable
        namespace="invoices"
        caption="Invoices"
        rows={rows}
        loading={loading}
        error={error}
        onRetry={reload}
        onRefresh={reload}
        getRowId={(row) => row.id}
        getStatus={(row) => row.payment_status}
        getDate={(row) => row.created_at}
        searchText={(row) => [row.manual_bill_number, row.quotation_title, row.payment_status, row.balance]}
        detailTitle={(row) => `Invoice ${row.manual_bill_number || row.id.slice(-6)}`}
        renderDetail={(row) => <InvoiceDetailBody id={row.id} />}
        columns={[
          {
            key: 'invoice',
            label: 'Invoice',
            cardLabel: true,
            render: (row) => <TruncatedText value={row.manual_bill_number || row.quotation_title || row.id.slice(-6)} max={24} />,
            exportValue: (row) => row.manual_bill_number || row.quotation_title || row.id,
            sortValue: (row) => row.manual_bill_number || row.quotation_title || row.id,
          },
          {
            key: 'date',
            label: 'Date',
            render: (row) => formatDate(row.created_at),
            exportValue: (row) => row.created_at,
            sortValue: (row) => row.created_at,
          },
          {
            key: 'total',
            label: 'Total',
            render: (row) => formatMoney(row.grand_total),
            exportValue: (row) => row.grand_total,
            sortValue: (row) => row.grand_total,
          },
          {
            key: 'paid',
            label: 'Paid',
            optional: true,
            render: (row) => formatMoney(row.paid_amount),
            exportValue: (row) => row.paid_amount,
            sortValue: (row) => row.paid_amount,
          },
          {
            key: 'balance',
            label: 'Balance',
            render: (row) => <strong>{formatMoney(row.balance)}</strong>,
            exportValue: (row) => row.balance,
            sortValue: (row) => row.balance,
          },
          {
            key: 'status',
            label: 'Status',
            render: (row) => <StatusChip status={row.payment_status} />,
            exportValue: (row) => row.payment_status,
            sortValue: (row) => row.payment_status,
          },
        ]}
      />
    </>
  )
}
