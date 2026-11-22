import { Notice, PageHeader, Stat, StateBox } from '../ui/kit'
import { formatNumber, guardResponseSize } from '../features/feature-pack/utils'
import { DataFreshness, RefreshButton, SkeletonRows } from '../features/feature-pack/components'
import { formatMoney, useQuery } from '../api/hooks'

interface Summary {
  hotel: string
  laundry_id: string
  open_gate_passes: number
  deliveries_this_month: number
  outstanding_amount: number
  invoiced_this_month: number
  currency: string
  totals_truncated: boolean
}

export function OverviewPage() {
  const { data, error, loading, updating, lastUpdated, reload } = useQuery<Summary>('/client-portal/summary')
  // The summary is a small object, but the same guard protects it if a future
  // deployment returns a nested list of monthly rows.
  const guarded = guardResponseSize([data ?? {}], 1)

  return (
    <>
      <PageHeader
        title={data?.hotel ?? 'Overview'}
        subtitle="This month with your laundry provider"
      />

      <div className="fp-table-toolbar" style={{ marginBottom: '0.9rem' }}>
        <DataFreshness at={lastUpdated} loading={updating} />
        <RefreshButton onRefresh={reload} label="Refresh overview" />
      </div>

      <StateBox loading={loading} error={error} onRetry={reload}>
        {loading ? (
          <SkeletonRows columns={4} rows={2} />
        ) : data ? (
          <>
            {guarded.truncated ? (
              <div className="fp-inline-warning" role="status">
                Only the first summary row could be displayed.
              </div>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Open gate passes" value={formatNumber(data.open_gate_passes)} hint="Still at the laundry" />
              <Stat label="Deliveries this month" value={formatNumber(data.deliveries_this_month)} />
              <Stat
                label="Outstanding"
                value={formatMoney(data.outstanding_amount, data.currency)}
                hint="Unpaid invoices"
              />
              <Stat
                label="Invoiced this month"
                value={formatMoney(data.invoiced_this_month, data.currency)}
                hint={data.totals_truncated ? 'Partial total — older history not counted' : undefined}
              />
            </div>
            {data.totals_truncated ? (
              <Notice tone="warning" title="Partial monthly total">
                Older history is not counted in this figure. The full amount appears on your statement.
              </Notice>
            ) : null}
          </>
        ) : null}
      </StateBox>

      <p className="mt-6 max-w-prose text-sm text-slate-500">
        Every figure on this page is computed by your provider&apos;s billing service from the
        records it holds. Nothing here is added up in the browser, so this screen and your
        paper statement always agree.
      </p>
    </>
  )
}
