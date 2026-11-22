/** The single source of truth for the 100 shipped portal features. */

export type FeatureArea = 'shell' | 'auth' | 'tables' | 'data' | 'access' | 'utility'

export interface FeatureEntry {
  id: number
  title: string
  description: string
  file: string
  area: FeatureArea
}

const entry = (
  id: number,
  area: FeatureArea,
  title: string,
  description: string,
  file: string,
): FeatureEntry => ({ id, area, title, description, file })

export const FEATURES: FeatureEntry[] = [
  entry(1, 'shell', 'Document title sync per route', 'FeatureProvider writes the current section into document.title on every navigation.', 'src/features/feature-pack/FeatureProvider.tsx'),
  entry(2, 'shell', 'Skip-to-content link', 'A keyboard-first skip link targets the main landmark before the header.', 'src/features/feature-pack/components.tsx'),
  entry(3, 'shell', 'Sticky header shadow on scroll', 'useScrolled adds a shadow class to the sticky top bar once the page scrolls.', 'src/features/feature-pack/hooks.ts'),
  entry(4, 'shell', 'Mobile drawer focus trap', 'The mobile navigation drawer traps Tab and returns focus to its trigger.', 'src/features/feature-pack/hooks.ts'),
  entry(5, 'shell', 'Mobile drawer closes on route change', 'The drawer closes whenever the location pathname changes.', 'src/shell/AppShell.tsx'),
  entry(6, 'shell', 'Nav aria-current', 'Sidebar, drawer and mobile links expose aria-current="page" for the active route.', 'src/shell/AppShell.tsx'),
  entry(7, 'shell', 'Persisted sidebar collapsed state', 'The sidebar collapse preference is stored under ll_hotel_sidebar_collapsed.', 'src/shell/AppShell.tsx'),
  entry(8, 'shell', 'Back-to-top button', 'A floating control appears after scrolling and returns focus to the main landmark.', 'src/features/feature-pack/components.tsx'),
  entry(9, 'shell', 'Route change progress bar', 'A slim top progress bar animates for each navigation and respects reduced motion.', 'src/features/feature-pack/FeatureProvider.tsx'),
  entry(10, 'shell', 'Global command palette (Ctrl/Cmd+K)', 'A searchable palette navigates sections and runs portal-only commands.', 'src/features/feature-pack/components.tsx'),
  entry(11, 'shell', 'Keyboard shortcut help dialog', 'Press ? or choose Help from the palette to open the shortcuts dialog.', 'src/features/feature-pack/components.tsx'),
  entry(12, 'shell', 'Reduced-motion aware animations', 'System preference and a manual toggle set data-reduced-motion for all animations.', 'src/features/feature-pack/FeatureProvider.tsx'),
  entry(13, 'tables', 'Debounced table search', 'FeatureTable debounces its search box before filtering visible rows.', 'src/features/feature-pack/hooks.ts'),
  entry(14, 'tables', 'Status filter', 'FeatureTable filters rows by a status getter and resets pagination on change.', 'src/features/feature-pack/components.tsx'),
  entry(15, 'tables', 'Date-range filter', 'From and to date inputs filter by each row’s date getter.', 'src/features/feature-pack/components.tsx'),
  entry(16, 'tables', 'Sortable columns', 'Column headers toggle ascending/descending sort with aria-sort on the th.', 'src/features/feature-pack/components.tsx'),
  entry(17, 'tables', 'Column visibility menu', 'A checkbox menu hides and restores optional columns, persisted per portal.', 'src/features/feature-pack/components.tsx'),
  entry(18, 'tables', 'Table density toggle', 'Comfortable/compact density is stored and applied to the table wrapper.', 'src/features/feature-pack/hooks.ts'),
  entry(19, 'tables', 'Row selection', 'Each row has an accessible checkbox driving a shared selection set.', 'src/features/feature-pack/components.tsx'),
  entry(20, 'tables', 'Select-all with indeterminate state', 'The header checkbox reflects all, some or none of the visible rows.', 'src/features/feature-pack/components.tsx'),
  entry(21, 'tables', 'Bulk action bar', 'Selected rows expose copy-ID, CSV, JSON and clear actions in one bar.', 'src/features/feature-pack/components.tsx'),
  entry(22, 'tables', 'CSV export', 'toCsv quotes cells and downloads the current filtered or selected rows.', 'src/features/feature-pack/utils.ts'),
  entry(23, 'tables', 'JSON export', 'toJson downloads the same view as indented JSON.', 'src/features/feature-pack/utils.ts'),
  entry(24, 'tables', 'Copy row ID', 'A labelled icon button copies the row id and reports success via toast.', 'src/features/feature-pack/components.tsx'),
  entry(25, 'tables', 'Page-size selector', 'FeatureTable offers 10/25/50/100 rows per page and resets the page.', 'src/features/feature-pack/components.tsx'),
  entry(26, 'tables', 'Pagination range clamp', 'clampPage and pageRange keep the pager inside the available range.', 'src/features/feature-pack/utils.ts'),
  entry(27, 'tables', 'Sticky table header', 'The table viewport scrolls under a sticky thead within the panel.', 'src/features/feature-pack/feature-pack.css'),
  entry(28, 'tables', 'Responsive card fallback', 'Narrow screens render the same rows as labelled cards instead of a wide table.', 'src/features/feature-pack/components.tsx'),
  entry(29, 'tables', 'Empty state with action', 'The empty state offers a one-click clear-filters action.', 'src/features/feature-pack/components.tsx'),
  entry(30, 'tables', 'Skeleton loading rows', 'SkeletonRows renders shimmering placeholders while a page query loads.', 'src/features/feature-pack/components.tsx'),
  entry(31, 'tables', 'Inline error + retry', 'Query errors show a normalised message with a retry button in place.', 'src/features/feature-pack/components.tsx'),
  entry(32, 'tables', 'Row detail drawer', 'Keyboard-activatable rows open a focus-trapped detail drawer.', 'src/features/feature-pack/components.tsx'),
  entry(33, 'auth', 'Required-field markers', 'Required inputs render a visible marker plus an accessible label.', 'src/features/feature-pack/components.tsx'),
  entry(34, 'auth', 'Inline validation on blur', 'useFieldValidation validates credentials when a field loses focus.', 'src/features/feature-pack/hooks.ts'),
  entry(35, 'auth', 'Disable submit until valid', 'Sign-in and password-check buttons stay disabled until validation passes.', 'src/auth/LoginPage.tsx'),
  entry(36, 'auth', 'Submit-once guard', 'useSubmitOnce blocks duplicate clicks and concurrent sign-in attempts.', 'src/features/feature-pack/hooks.ts'),
  entry(37, 'auth', 'Draft autosave', 'The username draft is autosaved locally; passwords are deliberately excluded.', 'src/features/feature-pack/hooks.ts'),
  entry(38, 'auth', 'Draft restore banner', 'A restore banner offers to bring back the saved username or discard it.', 'src/auth/LoginPage.tsx'),
  entry(39, 'auth', 'Reset form', 'A reset control clears fields, errors and the saved draft with confirmation.', 'src/auth/LoginPage.tsx'),
  entry(40, 'auth', 'Character counter', 'Live counters report username and password length against their limits.', 'src/features/feature-pack/components.tsx'),
  entry(41, 'utility', 'Currency formatting', 'formatMoney is shared by the overview, invoices and exports.', 'src/features/feature-pack/utils.ts'),
  entry(42, 'utility', 'Number formatting', 'formatNumber gives every piece count the same en-LK grouping.', 'src/features/feature-pack/utils.ts'),
  entry(43, 'utility', 'Date formatting', 'formatDate and formatDateTime render consistent, locale-aware timestamps.', 'src/features/feature-pack/utils.ts'),
  entry(44, 'tables', 'Duplicate-row detection', 'duplicateIds flags repeated ids and dedupeById keeps table keys unique.', 'src/features/feature-pack/utils.ts'),
  entry(45, 'auth', 'Field help tooltips', 'HelpTip exposes contextual guidance to sighted and screen-reader users.', 'src/features/feature-pack/components.tsx'),
  entry(46, 'data', 'Optimistic create/update', 'Notification updates apply locally first, persist immediately and roll back if storage rejects them.', 'src/features/feature-pack/FeatureProvider.tsx'),
  entry(47, 'auth', 'Confirm destructive dialog', 'ConfirmDialog guards sign-out, form reset and cache clearing.', 'src/features/feature-pack/components.tsx'),
  entry(48, 'utility', 'Success toasts', 'The provider renders polite success toasts for copy, export and refresh.', 'src/features/feature-pack/FeatureProvider.tsx'),
  entry(49, 'data', 'Normalized error messages', 'normalizeError is the only error text source for axios and form errors.', 'src/features/feature-pack/utils.ts'),
  entry(50, 'auth', 'Multi-step progress indicator', 'Sign-in shows Credentials → Laundry → Ready, including the 409 choice step.', 'src/features/feature-pack/components.tsx'),
  entry(51, 'auth', 'Collapsible form sections', 'Accessible details/sections group password guidance and sign-in help.', 'src/features/feature-pack/components.tsx'),
  entry(52, 'auth', 'Autosave indicator', 'A status line shows draft saved, saving and unavailable states.', 'src/features/feature-pack/components.tsx'),
  entry(53, 'auth', 'Multi-laundry choice screen', 'The 409 handler lists normalized associations and signs into the chosen one.', 'src/auth/LoginPage.tsx'),
  entry(54, 'auth', 'Suspended association disabled', 'Choices without ACTIVE status are disabled and explain why.', 'src/auth/LoginPage.tsx'),
  entry(55, 'auth', 'Role-specific labels', 'HOTEL_ADMIN and HOTEL_MANAGER get friendly labels; generic roles are rejected.', 'src/features/feature-pack/utils.ts'),
  entry(56, 'auth', 'Switch laundry without reload', 'The scope picker exchanges the token in place and remounts scoped pages.', 'src/shell/AppShell.tsx'),
  entry(57, 'auth', 'Remember last laundry', 'The last chosen laundry is persisted and marked in the choice screen.', 'src/features/feature-pack/utils.ts'),
  entry(58, 'data', 'Clear stale session on 401', 'The 401 interceptor clears the session and dispatches a portal event.', 'src/api/client.ts'),
  entry(59, 'auth', 'Session expiry warning', 'A warning banner appears before expiry with refresh and sign-out actions.', 'src/features/feature-pack/components.tsx'),
  entry(60, 'auth', 'Show/hide password', 'A labelled icon button toggles password visibility on the sign-in form.', 'src/auth/LoginPage.tsx'),
  entry(61, 'auth', 'Password strength meter', 'The managed-access page offers a local-only password strength checker.', 'src/auth/RegisterPage.tsx'),
  entry(62, 'auth', 'Registration field validation', 'The local password checker validates username and confirmation on blur.', 'src/auth/RegisterPage.tsx'),
  entry(63, 'auth', 'ClientType fixed per app', 'assertHotelClientType keeps the app pinned to HOTEL and /client/auth/login.', 'src/features/feature-pack/utils.ts'),
  entry(64, 'auth', 'Support exit action (safe sign-out)', '“Exit safely” clears portal state and tokens; no support impersonation exists.', 'src/features/feature-pack/components.tsx'),
  entry(65, 'shell', 'Scope badge', 'The top bar shows the active hotel scope and a HOTEL label.', 'src/shell/AppShell.tsx'),
  entry(66, 'auth', 'Safe sign-out', 'Sign-out confirms, clears cache and drafts, then navigates to /login.', 'src/shell/AppShell.tsx'),
  entry(67, 'auth', 'Last sign-in info', 'The last successful sign-in time and account are shown in the user panel.', 'src/features/feature-pack/FeatureProvider.tsx'),
  entry(68, 'utility', 'Aria-live regions', 'Route changes and toasts are announced through polite live regions.', 'src/features/feature-pack/FeatureProvider.tsx'),
  entry(69, 'utility', 'Focus-visible rings', 'A consistent high-visibility focus ring is applied to all interactive controls.', 'src/features/feature-pack/feature-pack.css'),
  entry(70, 'utility', 'Labelled icon buttons', 'Every icon-only control carries an aria-label or sr-only text.', 'src/features/feature-pack/components.tsx'),
  entry(71, 'tables', 'Keyboard row activation', 'Table rows are tabbable and Enter/Space opens the row detail drawer.', 'src/features/feature-pack/components.tsx'),
  entry(72, 'utility', 'Escape closes overlays', 'useEscape closes the palette, drawers, dialogs and detail panel.', 'src/features/feature-pack/hooks.ts'),
  entry(73, 'utility', 'Modal focus restore', 'useFocusTrap returns focus to the element that opened the overlay.', 'src/features/feature-pack/hooks.ts'),
  entry(74, 'utility', 'Screen-reader-only text', 'sr-only labels clarify controls without changing the visual layout.', 'src/features/feature-pack/components.tsx'),
  entry(75, 'shell', 'High-contrast mode toggle', 'A persisted toggle switches the portal to high-contrast tokens.', 'src/features/feature-pack/FeatureProvider.tsx'),
  entry(76, 'shell', 'Large-text toggle', 'A persisted toggle increases the root text scale across the portal.', 'src/features/feature-pack/FeatureProvider.tsx'),
  entry(77, 'utility', 'Tooltip on truncated text', 'TruncatedText adds a native tooltip only when the value is cut short.', 'src/features/feature-pack/components.tsx'),
  entry(78, 'shell', 'Semantic landmarks', 'Header, nav, main, aside and footer landmarks wrap the portal shell.', 'src/shell/AppShell.tsx'),
  entry(79, 'tables', 'Accessible table captions', 'Each FeatureTable renders a visually hidden caption naming its contents.', 'src/features/feature-pack/components.tsx'),
  entry(80, 'auth', 'Form error summary', 'ErrorSummary links field errors to their inputs after submit or blur.', 'src/features/feature-pack/components.tsx'),
  entry(81, 'tables', 'Skip pagination link', 'A “skip pagination” link returns keyboard focus to the first table row.', 'src/features/feature-pack/components.tsx'),
  entry(82, 'tables', 'Keyboard refresh/search shortcuts', 'Press / to focus table search and R to refresh the current page data.', 'src/features/feature-pack/components.tsx'),
  entry(83, 'data', 'Normalize null items arrays', 'normalizeItems converts null and wrapped list payloads into safe arrays.', 'src/features/feature-pack/utils.ts'),
  entry(84, 'data', 'Aggregate nested items', 'aggregateNestedItems totals nested line items and per-category pieces.', 'src/features/feature-pack/utils.ts'),
  entry(85, 'data', 'Stale-while-revalidate cache', 'useQuery serves cached data immediately and refreshes it in the background.', 'src/api/hooks.ts'),
  entry(86, 'data', 'Retry with backoff', 'Retryable GET failures are retried with capped exponential backoff.', 'src/api/hooks.ts'),
  entry(87, 'data', 'Request timeout messaging', 'Timeout codes are translated into a clear, actionable message.', 'src/features/feature-pack/utils.ts'),
  entry(88, 'shell', 'Offline indicator', 'A banner announces offline state using the browser online/offline events.', 'src/features/feature-pack/components.tsx'),
  entry(89, 'shell', 'Queued action indicator', 'Refresh actions attempted offline are queued and replayed when online.', 'src/features/feature-pack/FeatureProvider.tsx'),
  entry(90, 'data', 'Cache scope keyed by session', 'cacheKey combines the session scope, path and params for every entry.', 'src/features/feature-pack/utils.ts'),
  entry(91, 'data', 'Clear cache on sign-out', 'clearFeatureCache is called by sign-out and by the 401 handler.', 'src/features/feature-pack/components.tsx'),
  entry(92, 'data', 'Last-updated timestamp', 'useQuery records fetchedAt so each screen can show data freshness.', 'src/api/hooks.ts'),
  entry(93, 'data', 'Refresh page data', 'Labelled refresh buttons call reload and announce the result via toast.', 'src/features/feature-pack/components.tsx'),
  entry(94, 'shell', 'Error boundary with reset', 'ErrorBoundary catches render failures and offers a reset that clears the cache.', 'src/features/feature-pack/components.tsx'),
  entry(95, 'data', 'Response size guard', 'guardResponseSize truncates oversized lists and flags the truncation.', 'src/api/hooks.ts'),
  entry(96, 'data', 'Idempotency key for writes', 'Mutating requests receive a fresh X-Idempotency-Key header.', 'src/api/client.ts'),
  entry(97, 'data', 'Dedupe rapid submits', 'dedupeByKey plus useSubmitOnce prevent double writes from fast clicks.', 'src/features/feature-pack/hooks.ts'),
  entry(98, 'shell', 'Notification count badge', 'The top bar bell shows the count of unread portal notifications.', 'src/features/feature-pack/components.tsx'),
  entry(99, 'shell', 'Notification detail dialog', 'The bell opens a dialog with individual notifications and mark-as-read.', 'src/features/feature-pack/components.tsx'),
  entry(100, 'utility', 'Feature manifest panel', 'The /features route and palette command list all 100 shipped features.', 'src/features/feature-pack/FeaturePanel.tsx'),
]

export const FEATURE_COUNT = FEATURES.length

export const FEATURE_AREAS: Array<{ id: FeatureArea; label: string; blurb: string }> = [
  { id: 'shell', label: 'Shell & navigation', blurb: 'Layout, chrome and keyboard access' },
  { id: 'auth', label: 'Access & forms', blurb: 'Sign-in, scope selection and validation' },
  { id: 'tables', label: 'Tables', blurb: 'Search, filters, exports and row actions' },
  { id: 'data', label: 'Data handling', blurb: 'Caching, retries, guards and freshness' },
  { id: 'access', label: 'Account access', blurb: 'Hotel-only roles and session safety' },
  { id: 'utility', label: 'Utilities', blurb: 'Shared formatting and a11y primitives' },
]

export function featuresByArea(area: FeatureArea): FeatureEntry[] {
  return FEATURES.filter((feature) => feature.area === area)
}

export function searchFeatures(query: string): FeatureEntry[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return FEATURES
  return FEATURES.filter((feature) =>
    [feature.title, feature.description, feature.file, feature.area]
      .join(' ')
      .toLowerCase()
      .includes(needle),
  )
}

/** Fail fast if the catalog is edited down by accident. */
export function assertFeatureCatalog(): boolean {
  const ids = new Set(FEATURES.map((feature) => feature.id))
  return FEATURE_COUNT === 100 && ids.size === 100 && FEATURES.every((feature, index) => feature.id === index + 1)
}
