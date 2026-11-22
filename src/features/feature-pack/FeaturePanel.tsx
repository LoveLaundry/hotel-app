import { useMemo, useState } from 'react'
import { Check, ChevronDown, Copy, Search, Sparkles } from 'lucide-react'
import clsx from 'clsx'
import { PageHeader } from '../../ui/kit'
import { useFeatures } from './context'
import { useDebouncedValue, useEscape, useFocusTrap } from './hooks'
import { assertFeatureCatalog, FEATURE_AREAS, FEATURES, searchFeatures, type FeatureArea } from './manifest'
import { copyText, downloadText } from './utils'

export function FeatureGuide({
  variant = 'page',
  onClose,
}: {
  variant?: 'page' | 'dialog'
  onClose?: () => void
}) {
  const { notify } = useFeatures()
  const [query, setQuery] = useState('')
  const [area, setArea] = useState<FeatureArea | 'all'>('all')
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set(FEATURES.slice(0, 1).map((item) => item.id)))
  const debouncedQuery = useDebouncedValue(query, 200)
  const isDialog = variant === 'dialog'
  const trapRef = useFocusTrap<HTMLDivElement>(isDialog)
  useEscape(isDialog, () => onClose?.())

  const results = useMemo(() => {
    const byQuery = searchFeatures(debouncedQuery)
    return area === 'all' ? byQuery : byQuery.filter((item) => item.area === area)
  }, [debouncedQuery, area])

  const complete = assertFeatureCatalog()

  function toggle(id: number) {
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function copyManifest() {
    const lines = FEATURES.map((item) => `${item.id}. ${item.title} — ${item.description} (${item.file})`)
    void copyText(lines.join('\n')).then((ok) =>
      notify(ok ? 'Feature manifest copied.' : 'Clipboard is unavailable in this browser.', ok ? 'success' : 'error'),
    )
  }

  function exportManifest() {
    downloadText('hotel-portal-features.txt', FEATURES.map((item) => `${item.id}. ${item.title}\n${item.description}\n${item.file}\n`).join('\n'))
    notify('Feature manifest downloaded.')
  }

  const content = (
    <>
      <div className="fp-guide-intro">
        <Sparkles aria-hidden="true" />
        <div>
          <strong>{complete ? `${FEATURES.length} features in this build` : 'Feature catalog needs attention'}</strong>
          <p>Every entry below has a live code path in this portal. Search or filter to inspect one.</p>
        </div>
      </div>

      <div className="fp-guide-controls">
        <label className="fp-search">
          <Search size={14} aria-hidden="true" />
          <span className="sr-only">Search features</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search features or files…" aria-label="Search features" />
        </label>
        <div className="fp-guide-filters" role="group" aria-label="Filter features by area">
          <button type="button" className={clsx('fp-filter', area === 'all' && 'is-active')} onClick={() => setArea('all')}>
            All <span>{FEATURES.length}</span>
          </button>
          {FEATURE_AREAS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={clsx('fp-filter', area === item.id && 'is-active')}
              onClick={() => setArea(item.id)}
              title={item.blurb}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="fp-guide-actions">
          <button type="button" className="btn btn-secondary" onClick={() => setExpanded(new Set(results.map((item) => item.id)))}>
            Expand all
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => setExpanded(new Set())}>
            Collapse all
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => void copyManifest()} aria-label="Copy feature manifest">
            <Copy aria-hidden="true" /> Copy
          </button>
          <button type="button" className="btn btn-secondary" onClick={exportManifest}>
            Export
          </button>
        </div>
      </div>

      <p className="fp-guide-result-count" role="status">
        Showing {results.length} of {FEATURES.length} features
      </p>

      <ol className="fp-guide-list">
        {results.map((feature) => {
          const open = expanded.has(feature.id)
          return (
            <li key={feature.id} className={clsx('fp-guide-item', open && 'is-open')}>
              <button
                type="button"
                className="fp-guide-row"
                aria-expanded={open}
                onClick={() => toggle(feature.id)}
              >
                <span className="fp-guide-id">{String(feature.id).padStart(2, '0')}</span>
                <span className="fp-guide-title">{feature.title}</span>
                <span className="fp-guide-area">{feature.area}</span>
                <ChevronDown size={14} aria-hidden="true" />
              </button>
              {open ? (
                <div className="fp-guide-detail">
                  <p>{feature.description}</p>
                  <code>{feature.file}</code>
                </div>
              ) : null}
            </li>
          )
        })}
        {results.length === 0 ? (
          <li className="fp-guide-empty">
            <Check aria-hidden="true" /> No features match that search.
          </li>
        ) : null}
      </ol>
    </>
  )

  if (isDialog) {
    return (
      <div className="fp-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose?.()}>
        <div ref={trapRef} className="fp-dialog fp-guide-dialog" role="dialog" aria-modal="true" aria-labelledby="fp-guide-title" tabIndex={-1}>
          <div className="fp-drawer-head">
            <h2 id="fp-guide-title">Feature guide</h2>
            <button type="button" className="btn btn-ghost fp-icon-button" onClick={onClose} aria-label="Close feature guide">
              ×
            </button>
          </div>
          <div className="fp-guide-scroll">{content}</div>
        </div>
      </div>
    )
  }

  return (
    <>
      <PageHeader title="Feature guide" subtitle="A complete, searchable inventory of this portal build" />
      <section className="panel panel-pad fp-guide-page">{content}</section>
    </>
  )
}

export default FeatureGuide
