import assert from 'node:assert/strict'
import test from 'node:test'

import { FEATURES, FEATURE_COUNT, assertFeatureCatalog, searchFeatures } from '../src/features/feature-pack/manifest'
import {
  aggregateNestedItems,
  assertHotelClientType,
  assertHotelRole,
  cacheKey,
  clampPage,
  dedupeById,
  duplicateIds,
  filterRows,
  formatMoney,
  formatNumber,
  guardResponseSize,
  isSafePortalPath,
  normalizeAssociation,
  normalizeError,
  normalizeItems,
  orderChoices,
  pageRange,
  passwordStrength,
  pieces,
  sortRows,
  stepStatus,
  toCsv,
  toJson,
  validateCredentials,
} from '../src/features/feature-pack/utils'

test('manifest contains exactly 100 unique, ordered features', () => {
  assert.equal(FEATURE_COUNT, 100)
  assert.equal(FEATURES.length, 100)
  assert.equal(assertFeatureCatalog(), true)
  assert.equal(new Set(FEATURES.map((feature) => feature.file)).size > 5, true)
  assert.equal(searchFeatures('command palette').some((feature) => feature.id === 10), true)
})

test('multi-laundry candidates get ACTIVE and HOTEL display defaults', () => {
  const choice = normalizeAssociation({ laundry_id: 'L1', laundry_name: 'Grand Hotel' })
  assert.equal(choice.status, 'ACTIVE')
  assert.equal(choice.role_id, 'HOTEL_ADMIN')
  assert.equal(choice.client_type, 'HOTEL')
  assert.equal(choice.laundry_name, 'Grand Hotel')
  assert.equal(normalizeAssociation(null).laundry_id, '')
})

test('only hotel entity roles are accepted', () => {
  assert.equal(assertHotelRole('HOTEL_MANAGER'), 'HOTEL_MANAGER')
  assert.equal(assertHotelRole(''), 'HOTEL_ADMIN')
  for (const role of ['ADMIN', 'MANAGER', 'STAFF', 'SHOP_ADMIN']) {
    assert.throws(() => assertHotelRole(role), /hotel account|unrecognised hotel role/i)
  }
  assert.equal(assertHotelClientType('HOTEL'), 'HOTEL')
  assert.throws(() => assertHotelClientType('SHOP'), /hotel accounts/i)
})

test('remembered choice sorts first while suspended choices stay last', () => {
  const choices = [
    { laundry_id: 'a', status: 'SUSPENDED' },
    { laundry_id: 'b', status: 'ACTIVE' },
    { laundry_id: 'c', status: 'ACTIVE' },
  ]
  assert.deepEqual(orderChoices(choices, 'c').map((item) => item.laundry_id), ['c', 'b', 'a'])
})

test('filtering, sorting, pagination and duplicate detection are pure and safe', () => {
  const rows = [
    { id: '1', name: 'Beta', status: 'PAID', date: '2026-01-02' },
    { id: '2', name: 'Alpha', status: 'PENDING', date: '2026-02-03' },
    { id: '3', name: 'Gamma', status: 'PAID', date: '2026-03-04' },
  ]
  assert.equal(filterRows(rows, { search: 'alp' }, { search: (row) => [row.name] }).length, 1)
  assert.equal(filterRows(rows, { status: 'paid' }, { status: (row) => row.status }).length, 2)
  assert.equal(filterRows(rows, { from: '2026-02-01', to: '2026-02-28' }, { date: (row) => row.date }).length, 1)
  assert.deepEqual(sortRows(rows, 'name', 'asc', (row, key) => (row as Record<string, string>)[key]).map((row) => row.name), ['Alpha', 'Beta', 'Gamma'])
  assert.equal(clampPage(9, 3), 2)
  assert.equal(clampPage(-1, 3), 0)
  assert.deepEqual(pageRange(1, 25, 60), { start: 26, end: 50 })
  assert.deepEqual(duplicateIds([...rows, rows[0]], (row) => row.id), ['1'])
  assert.equal(dedupeById([...rows, rows[0]], (row) => row.id).length, 3)
})

test('nested items aggregate quantities and null arrays normalise to empty', () => {
  const row = {
    items: [
      { category: 'Towel', client_qty: 4 },
      { category: 'Towel', received_qty: 2 },
      { category: 'Sheet', quantity: 'nope' },
    ],
  }
  assert.deepEqual(aggregateNestedItems(row), { pieces: 6, lines: 3, categories: { Towel: 6, Sheet: 0 } })
  assert.equal(pieces(row.items), 6)
  assert.equal(pieces(null), 0)
  assert.deepEqual(normalizeItems(null), [])
  assert.deepEqual(normalizeItems({ items: [1, 2] }), [1, 2])
  assert.deepEqual(guardResponseSize([1, 2, 3], 2), { items: [1, 2], truncated: true })
})

test('exports quote cells and keep stable column order', () => {
  const rows = [{ id: 'a,1', note: 'He said "yes"' }]
  const columns = [
    { key: 'id', label: 'ID', value: (row: { id: string }) => row.id },
    { key: 'note', label: 'Note', value: (row: { note: string }) => row.note },
  ]
  const csv = toCsv(rows, columns)
  assert.equal(csv.split('\r\n')[0], '"ID","Note"')
  assert.match(csv, /"He said ""yes"""/)
  assert.deepEqual(JSON.parse(toJson(rows, columns)), [{ id: 'a,1', note: 'He said "yes"' }])
})

test('formatting and error text are stable', () => {
  assert.equal(formatNumber(1234.5), '1,234.5')
  assert.equal(formatNumber('bad'), '—')
  assert.equal(formatMoney(10, 'LKR').startsWith('LKR') || formatMoney(10, 'LKR').includes('10'), true)
  assert.equal(normalizeError({ code: 'ECONNABORTED' }), 'The server took too long to respond. Try again.')
  assert.equal(normalizeError({ response: { status: 401 } }), 'Your session has ended. Sign in again to continue.')
  assert.equal(normalizeError({ response: { status: 404 } }), 'The requested information is not available yet.')
  assert.equal(normalizeError('Plain failure'), 'Plain failure')
})

test('cache keys are session scoped and portal paths stay inside the app', () => {
  const first = cacheKey('user-a', '/client-portal/bills', { limit: 25, skip: undefined })
  const second = cacheKey('user-b', '/client-portal/bills', { limit: 25 })
  assert.notEqual(first, second)
  assert.equal(first.includes('skip'), false)
  assert.equal(isSafePortalPath('/client-portal/summary'), true)
  assert.equal(isSafePortalPath('/today'), false)
  assert.equal(isSafePortalPath('/laundry/orders'), false)
})

test('form helpers reject empty credentials and score weak passwords', () => {
  assert.deepEqual(validateCredentials({ username: '', password: '' }), {
    username: 'Enter your account username.',
    password: 'Enter your password.',
  })
  assert.equal(validateCredentials({ username: 'hotel', password: 'short' }, 'check').password, 'Use at least 10 characters for a new password.')
  assert.equal(passwordStrength('').tone, 'weak')
  assert.equal(passwordStrength('CorrectHorseBattery123!').tone, 'strong')
  assert.equal(stepStatus(1, 1), 'current')
  assert.equal(stepStatus(0, 1), 'done')
})
