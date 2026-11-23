# Hotel portal feature pack

100 delivered frontend features. Every entry maps to a live code path in this standalone hotel portal; no external branding is used outside /about.

1. **Document title sync per route** — FeatureProvider writes the current section into document.title on every navigation. _(src/features/feature-pack/FeatureProvider.tsx)_
2. **Skip-to-content link** — A keyboard-first skip link targets the main landmark before the header. _(src/features/feature-pack/components.tsx)_
3. **Sticky header shadow on scroll** — useScrolled adds a shadow class to the sticky top bar once the page scrolls. _(src/features/feature-pack/hooks.ts)_
4. **Mobile drawer focus trap** — The mobile navigation drawer traps Tab and returns focus to its trigger. _(src/features/feature-pack/hooks.ts)_
5. **Mobile drawer closes on route change** — The drawer closes whenever the location pathname changes. _(src/shell/AppShell.tsx)_
6. **Nav aria-current** — Sidebar, drawer and mobile links expose aria-current="page" for the active route. _(src/shell/AppShell.tsx)_
7. **Persisted sidebar collapsed state** — The sidebar collapse preference is stored under ll_hotel_sidebar_collapsed. _(src/shell/AppShell.tsx)_
8. **Back-to-top button** — A floating control appears after scrolling and returns focus to the main landmark. _(src/features/feature-pack/components.tsx)_
9. **Route change progress bar** — A slim top progress bar animates for each navigation and respects reduced motion. _(src/features/feature-pack/FeatureProvider.tsx)_
10. **Global command palette (Ctrl/Cmd+K)** — A searchable palette navigates sections and runs portal-only commands. _(src/features/feature-pack/components.tsx)_
11. **Keyboard shortcut help dialog** — Press ? or choose Help from the palette to open the shortcuts dialog. _(src/features/feature-pack/components.tsx)_
12. **Reduced-motion aware animations** — System preference and a manual toggle set data-reduced-motion for all animations. _(src/features/feature-pack/FeatureProvider.tsx)_
13. **Debounced table search** — FeatureTable debounces its search box before filtering visible rows. _(src/features/feature-pack/hooks.ts)_
14. **Status filter** — FeatureTable filters rows by a status getter and resets pagination on change. _(src/features/feature-pack/components.tsx)_
15. **Date-range filter** — From and to date inputs filter by each row’s date getter. _(src/features/feature-pack/components.tsx)_
16. **Sortable columns** — Column headers toggle ascending/descending sort with aria-sort on the th. _(src/features/feature-pack/components.tsx)_
17. **Column visibility menu** — A checkbox menu hides and restores optional columns, persisted per portal. _(src/features/feature-pack/components.tsx)_
18. **Table density toggle** — Comfortable/compact density is stored and applied to the table wrapper. _(src/features/feature-pack/hooks.ts)_
19. **Row selection** — Each row has an accessible checkbox driving a shared selection set. _(src/features/feature-pack/components.tsx)_
20. **Select-all with indeterminate state** — The header checkbox reflects all, some or none of the visible rows. _(src/features/feature-pack/components.tsx)_
21. **Bulk action bar** — Selected rows expose copy-ID, CSV, JSON and clear actions in one bar. _(src/features/feature-pack/components.tsx)_
22. **CSV export** — toCsv quotes cells and downloads the current filtered or selected rows. _(src/features/feature-pack/utils.ts)_
23. **JSON export** — toJson downloads the same view as indented JSON. _(src/features/feature-pack/utils.ts)_
24. **Copy row ID** — A labelled icon button copies the row id and reports success via toast. _(src/features/feature-pack/components.tsx)_
25. **Page-size selector** — FeatureTable offers 10/25/50/100 rows per page and resets the page. _(src/features/feature-pack/components.tsx)_
26. **Pagination range clamp** — clampPage and pageRange keep the pager inside the available range. _(src/features/feature-pack/utils.ts)_
27. **Sticky table header** — The table viewport scrolls under a sticky thead within the panel. _(src/features/feature-pack/feature-pack.css)_
28. **Responsive card fallback** — Narrow screens render the same rows as labelled cards instead of a wide table. _(src/features/feature-pack/components.tsx)_
29. **Empty state with action** — The empty state offers a one-click clear-filters action. _(src/features/feature-pack/components.tsx)_
30. **Skeleton loading rows** — SkeletonRows renders shimmering placeholders while a page query loads. _(src/features/feature-pack/components.tsx)_
31. **Inline error + retry** — Query errors show a normalised message with a retry button in place. _(src/features/feature-pack/components.tsx)_
32. **Row detail drawer** — Keyboard-activatable rows open a focus-trapped detail drawer. _(src/features/feature-pack/components.tsx)_
33. **Required-field markers** — Required inputs render a visible marker plus an accessible label. _(src/features/feature-pack/components.tsx)_
34. **Inline validation on blur** — useFieldValidation validates credentials when a field loses focus. _(src/features/feature-pack/hooks.ts)_
35. **Disable submit until valid** — Sign-in and password-check buttons stay disabled until validation passes. _(src/auth/LoginPage.tsx)_
36. **Submit-once guard** — useSubmitOnce blocks duplicate clicks and concurrent sign-in attempts. _(src/features/feature-pack/hooks.ts)_
37. **Draft autosave** — The username draft is autosaved locally; passwords are deliberately excluded. _(src/features/feature-pack/hooks.ts)_
38. **Draft restore banner** — A restore banner offers to bring back the saved username or discard it. _(src/auth/LoginPage.tsx)_
39. **Reset form** — A reset control clears fields, errors and the saved draft with confirmation. _(src/auth/LoginPage.tsx)_
40. **Character counter** — Live counters report username and password length against their limits. _(src/features/feature-pack/components.tsx)_
41. **Currency formatting** — formatMoney is shared by the overview, invoices and exports. _(src/features/feature-pack/utils.ts)_
42. **Number formatting** — formatNumber gives every piece count the same en-LK grouping. _(src/features/feature-pack/utils.ts)_
43. **Date formatting** — formatDate and formatDateTime render consistent, locale-aware timestamps. _(src/features/feature-pack/utils.ts)_
44. **Duplicate-row detection** — duplicateIds flags repeated ids and dedupeById keeps table keys unique. _(src/features/feature-pack/utils.ts)_
45. **Field help tooltips** — HelpTip exposes contextual guidance to sighted and screen-reader users. _(src/features/feature-pack/components.tsx)_
46. **Optimistic create/update** — Notification updates apply locally first, persist immediately and roll back if storage rejects them. _(src/features/feature-pack/FeatureProvider.tsx)_
47. **Confirm destructive dialog** — ConfirmDialog guards sign-out, form reset and cache clearing. _(src/features/feature-pack/components.tsx)_
48. **Success toasts** — The provider renders polite success toasts for copy, export and refresh. _(src/features/feature-pack/FeatureProvider.tsx)_
49. **Normalized error messages** — normalizeError is the only error text source for axios and form errors. _(src/features/feature-pack/utils.ts)_
50. **Multi-step progress indicator** — Sign-in shows Credentials → Laundry → Ready, including the 409 choice step. _(src/features/feature-pack/components.tsx)_
51. **Collapsible form sections** — Accessible details/sections group password guidance and sign-in help. _(src/features/feature-pack/components.tsx)_
52. **Autosave indicator** — A status line shows draft saved, saving and unavailable states. _(src/features/feature-pack/components.tsx)_
53. **Multi-laundry choice screen** — The 409 handler lists normalized associations and signs into the chosen one. _(src/auth/LoginPage.tsx)_
54. **Suspended association disabled** — Choices without ACTIVE status are disabled and explain why. _(src/auth/LoginPage.tsx)_
55. **Role-specific labels** — HOTEL_ADMIN and HOTEL_MANAGER get friendly labels; generic roles are rejected. _(src/features/feature-pack/utils.ts)_
56. **Switch laundry without reload** — The scope picker exchanges the token in place and remounts scoped pages. _(src/shell/AppShell.tsx)_
57. **Remember last laundry** — The last chosen laundry is persisted and marked in the choice screen. _(src/features/feature-pack/utils.ts)_
58. **Clear stale session on 401** — The 401 interceptor clears the session and dispatches a portal event. _(src/api/client.ts)_
59. **Session expiry warning** — A warning banner appears before expiry with refresh and sign-out actions. _(src/features/feature-pack/components.tsx)_
60. **Show/hide password** — A labelled icon button toggles password visibility on the sign-in form. _(src/auth/LoginPage.tsx)_
61. **Password strength meter** — The managed-access page offers a local-only password strength checker. _(src/auth/RegisterPage.tsx)_
62. **Registration field validation** — The local password checker validates username and confirmation on blur. _(src/auth/RegisterPage.tsx)_
63. **ClientType fixed per app** — assertHotelClientType keeps the app pinned to HOTEL and /client/auth/login. _(src/features/feature-pack/utils.ts)_
64. **Support exit action (safe sign-out)** — “Exit safely” clears portal state and tokens; no support impersonation exists. _(src/features/feature-pack/components.tsx)_
65. **Scope badge** — The top bar shows the active hotel scope and a HOTEL label. _(src/shell/AppShell.tsx)_
66. **Safe sign-out** — Sign-out confirms, clears cache and drafts, then navigates to /login. _(src/shell/AppShell.tsx)_
67. **Last sign-in info** — The last successful sign-in time and account are shown in the user panel. _(src/features/feature-pack/FeatureProvider.tsx)_
68. **Aria-live regions** — Route changes and toasts are announced through polite live regions. _(src/features/feature-pack/FeatureProvider.tsx)_
69. **Focus-visible rings** — A consistent high-visibility focus ring is applied to all interactive controls. _(src/features/feature-pack/feature-pack.css)_
70. **Labelled icon buttons** — Every icon-only control carries an aria-label or sr-only text. _(src/features/feature-pack/components.tsx)_
71. **Keyboard row activation** — Table rows are tabbable and Enter/Space opens the row detail drawer. _(src/features/feature-pack/components.tsx)_
72. **Escape closes overlays** — useEscape closes the palette, drawers, dialogs and detail panel. _(src/features/feature-pack/hooks.ts)_
73. **Modal focus restore** — useFocusTrap returns focus to the element that opened the overlay. _(src/features/feature-pack/hooks.ts)_
74. **Screen-reader-only text** — sr-only labels clarify controls without changing the visual layout. _(src/features/feature-pack/components.tsx)_
75. **High-contrast mode toggle** — A persisted toggle switches the portal to high-contrast tokens. _(src/features/feature-pack/FeatureProvider.tsx)_
76. **Large-text toggle** — A persisted toggle increases the root text scale across the portal. _(src/features/feature-pack/FeatureProvider.tsx)_
77. **Tooltip on truncated text** — TruncatedText adds a native tooltip only when the value is cut short. _(src/features/feature-pack/components.tsx)_
78. **Semantic landmarks** — Header, nav, main, aside and footer landmarks wrap the portal shell. _(src/shell/AppShell.tsx)_
79. **Accessible table captions** — Each FeatureTable renders a visually hidden caption naming its contents. _(src/features/feature-pack/components.tsx)_
80. **Form error summary** — ErrorSummary links field errors to their inputs after submit or blur. _(src/features/feature-pack/components.tsx)_
81. **Skip pagination link** — A “skip pagination” link returns keyboard focus to the first table row. _(src/features/feature-pack/components.tsx)_
82. **Keyboard refresh/search shortcuts** — Press / to focus table search and R to refresh the current page data. _(src/features/feature-pack/components.tsx)_
83. **Normalize null items arrays** — normalizeItems converts null and wrapped list payloads into safe arrays. _(src/features/feature-pack/utils.ts)_
84. **Aggregate nested items** — aggregateNestedItems totals nested line items and per-category pieces. _(src/features/feature-pack/utils.ts)_
85. **Stale-while-revalidate cache** — useQuery serves cached data immediately and refreshes it in the background. _(src/api/hooks.ts)_
86. **Retry with backoff** — Retryable GET failures are retried with capped exponential backoff. _(src/api/hooks.ts)_
87. **Request timeout messaging** — Timeout codes are translated into a clear, actionable message. _(src/features/feature-pack/utils.ts)_
88. **Offline indicator** — A banner announces offline state using the browser online/offline events. _(src/features/feature-pack/components.tsx)_
89. **Queued action indicator** — Refresh actions attempted offline are queued and replayed when online. _(src/features/feature-pack/FeatureProvider.tsx)_
90. **Cache scope keyed by session** — cacheKey combines the session scope, path and params for every entry. _(src/features/feature-pack/utils.ts)_
91. **Clear cache on sign-out** — clearFeatureCache is called by sign-out and by the 401 handler. _(src/features/feature-pack/components.tsx)_
92. **Last-updated timestamp** — useQuery records fetchedAt so each screen can show data freshness. _(src/api/hooks.ts)_
93. **Refresh page data** — Labelled refresh buttons call reload and announce the result via toast. _(src/features/feature-pack/components.tsx)_
94. **Error boundary with reset** — ErrorBoundary catches render failures and offers a reset that clears the cache. _(src/features/feature-pack/components.tsx)_
95. **Response size guard** — guardResponseSize truncates oversized lists and flags the truncation. _(src/api/hooks.ts)_
96. **Idempotency key for writes** — Mutating requests receive a fresh X-Idempotency-Key header. _(src/api/client.ts)_
97. **Dedupe rapid submits** — dedupeByKey plus useSubmitOnce prevent double writes from fast clicks. _(src/features/feature-pack/hooks.ts)_
98. **Notification count badge** — The top bar bell shows the count of unread portal notifications. _(src/features/feature-pack/components.tsx)_
99. **Notification detail dialog** — The bell opens a dialog with individual notifications and mark-as-read. _(src/features/feature-pack/components.tsx)_
100. **Feature manifest panel** — The /features route and palette command list all 100 shipped features. _(src/features/feature-pack/FeaturePanel.tsx)_

Validation: `npm run build` and `npm test` (10 pure-logic test cases).

## Current platform state — unified theme sync (2026-11-23)

- The 100-item catalogue above is unchanged; `/features` still lists the same 100 code paths.
- `src/ll-theme.tsx` and `src/ll-design-tokens.css` are now synced from the authoritative
  `system-manegment/quotations-ui` checkout, so the hotel portal uses the same 20
  contrast-checked light/dark themes, no-blue five-colour palette, semantic aliases,
  sidebar contrast fix and print styles as the manager UI.
- The saved theme (`lovelaundry-theme`, with legacy `theme-preset` migration) is applied to
  `<html data-theme>` by the inline `index.html` script before first paint, avoiding a flash.
- A compact `ThemeSwitcher` in the top bar lets operators change theme without leaving the
  portal. The feature-pack high-contrast / large-text / reduced-motion toggles still work
  under every theme via an `html:root[data-contrast='high']` compatibility block.
- Verified locally: `npm run build` (`tsc --noEmit` + Vite) and `npm test` (**10/10 passed**).
  Node 20.16 is below Vite 8's recommended 20.19+, so the build prints an engine warning only.
