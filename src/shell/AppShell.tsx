import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import {
  Building2,
  FileText,
  Info,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Shirt,
  Ticket,
  Truck,
  UserRound,
  WashingMachine,
} from 'lucide-react'
import { appConfig } from '../config/app'
import { useAuth } from '../auth/AuthContext'
import { ThemeSwitcher } from '../ll-theme'
import { useFeatures } from '../features/feature-pack/context'
import {
  Drawer,
  LastSignInInfo,
  MenuButton,
  ScopeBadge,
  TruncatedText,
} from '../features/feature-pack/components'
import { useLocalStorageState, useScrolled } from '../features/feature-pack/hooks'
import { friendlyRole, normalizeAssociation, STORAGE_KEYS } from '../features/feature-pack/utils'
import clsx from 'clsx'

const NAV_ICONS: Record<string, LucideIcon> = {
  '/': LayoutDashboard,
  '/gate-passes': Ticket,
  '/linens': Shirt,
  '/deliveries': Truck,
  '/invoices': FileText,
}

function isCurrent(pathname: string, path: string): boolean {
  return path === '/' ? pathname === '/' : pathname === path || pathname.startsWith(`${path}/`)
}

export function AppShell() {
  const { user, laundries, currentLaundry, switchLaundry } = useAuth()
  const { requestConfirm, clearPortalState, notify } = useFeatures()
  const location = useLocation()
  const scrolled = useScrolled()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [collapsed, setCollapsed] = useLocalStorageState(STORAGE_KEYS.sidebarCollapsed, false)
  const [switching, setSwitching] = useState<string | null>(null)

  const scope = user?.clientName ?? user?.laundry
  const canSwitch = laundries.length > 1
  const choices = laundries.map(normalizeAssociation)
  const navItems = appConfig.nav

  // A route change always dismisses the mobile drawer, even for back/forward.
  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname])

  function safeSignOut() {
    requestConfirm({
      title: 'Sign out of the portal?',
      body: 'This clears your session and portal data stored on this device. You can sign in again at any time.',
      confirmLabel: 'Sign out',
      tone: 'danger',
      onConfirm: clearPortalState,
    })
  }

  async function changeLaundry(id: string) {
    if (id === currentLaundry || switching) return
    setSwitching(id)
    try {
      await switchLaundry(id)
      const choice = choices.find((item) => item.laundry_id === id)
      notify(`Switched to ${choice?.laundry_name ?? 'the selected laundry'}.`)
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not switch laundry.', 'error')
    } finally {
      setSwitching(null)
    }
  }

  return (
    <div className={clsx('app-shell', collapsed && 'is-sidebar-collapsed', scrolled && 'has-scrolled-topbar')}>
      <aside className="app-sidebar" aria-label="Primary sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-mark" aria-hidden="true">
            <WashingMachine />
          </span>
          {!collapsed ? <p className="sidebar-title">{appConfig.title}</p> : <span className="sr-only">{appConfig.title}</span>}
          <button
            type="button"
            className="sidebar-collapse"
            onClick={() => setCollapsed((current) => !current)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-pressed={collapsed}
          >
            {collapsed ? <PanelLeftOpen aria-hidden="true" /> : <PanelLeftClose aria-hidden="true" />}
          </button>
        </div>

        <p className="sidebar-section">{collapsed ? <span className="sr-only">Workspace</span> : 'Workspace'}</p>
        <nav className="sidebar-nav" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = NAV_ICONS[item.path] ?? LayoutDashboard
            const current = isCurrent(location.pathname, item.path)
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) => clsx('sidebar-link', isActive && 'is-active')}
                aria-current={current ? 'page' : undefined}
                title={collapsed ? item.label : undefined}
              >
                <Icon aria-hidden="true" />
                {collapsed ? <span className="sr-only">{item.label}</span> : <TruncatedText value={item.label} max={22} />}
              </NavLink>
            )
          })}
        </nav>

        <div className="sidebar-bottom">
          <NavLink
            to="/about"
            className={({ isActive }) => clsx('sidebar-link', isActive && 'is-active')}
            aria-current={isCurrent(location.pathname, '/about') ? 'page' : undefined}
            title={collapsed ? 'About this portal' : undefined}
          >
            <Info aria-hidden="true" />
            {collapsed ? <span className="sr-only">About this portal</span> : 'About this portal'}
          </NavLink>
          <button type="button" onClick={safeSignOut} className="sidebar-link" title={collapsed ? 'Sign out' : undefined}>
            <LogOut aria-hidden="true" />
            {collapsed ? <span className="sr-only">Sign out</span> : 'Sign out'}
          </button>
        </div>
      </aside>

      <div className="app-content">
        <header className="app-topbar">
          <div className="topbar-main">
            <div className="topbar-title">
              <h1>{appConfig.title}</h1>
              <p className="topbar-subtitle">{scope ?? appConfig.tagline}</p>
            </div>

            <div className="topbar-actions">
              <MenuButton onClick={() => setDrawerOpen(true)} open={drawerOpen} />
              {canSwitch ? (
                <label className="select-wrap">
                  <Building2 aria-hidden="true" />
                  <span className="sr-only">Switch laundry</span>
                  <select
                    value={currentLaundry ?? ''}
                    onChange={(event) => void changeLaundry(event.target.value)}
                    className="field-input select-input scope-select"
                    disabled={switching !== null}
                    aria-label="Switch laundry"
                  >
                    {choices.map((choice) => (
                      <option
                        key={`${choice.laundry_id}-${choice.client_name}`}
                        value={choice.laundry_id}
                        disabled={choice.status !== 'ACTIVE'}
                      >
                        {choice.status !== 'ACTIVE'
                          ? `${choice.laundry_name} (${choice.status.toLowerCase()})`
                          : choice.laundry_name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              <ThemeSwitcher compact className="fp-topbar-theme" />

              <ScopeBadge label={scope} />

              <div className="app-user">
                <span className="app-avatar" aria-hidden="true">
                  <UserRound />
                </span>
                <div className="user-meta">
                  <p className="user-name">{user?.name}</p>
                  <p className="user-role">{friendlyRole(user?.role)}</p>
                  <LastSignInInfo />
                </div>
              </div>
            </div>
          </div>

          <nav className="mobile-nav" aria-label="Quick navigation">
            {navItems.map((item) => {
              const Icon = NAV_ICONS[item.path] ?? LayoutDashboard
              const current = isCurrent(location.pathname, item.path)
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) => clsx('mobile-nav-link', isActive && 'is-active')}
                  aria-current={current ? 'page' : undefined}
                >
                  <Icon aria-hidden="true" />
                  {item.label}
                </NavLink>
              )
            })}
          </nav>
        </header>

        <main className="app-main" id="main-content" tabIndex={-1}>
          {/* Switching laundry replaces the token and scope. Remount the routed
              page so no query or form from the previous tenant survives. */}
          <Outlet key={currentLaundry ?? 'none'} />
        </main>

        <footer className="app-footer">
          <div className="app-footer-inner">
            <span>Account portal · Signed in as {user?.name ?? 'user'}</span>
            <NavLink to="/about" className="text-link">
              <Info aria-hidden="true" />
              About this portal
            </NavLink>
          </div>
        </footer>
      </div>

      <Drawer open={drawerOpen} title="Navigation" side="left" onClose={() => setDrawerOpen(false)}>
        <nav className="fp-drawer-nav" aria-label="Mobile navigation">
          {navItems.map((item) => {
            const Icon = NAV_ICONS[item.path] ?? LayoutDashboard
            const current = isCurrent(location.pathname, item.path)
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={clsx('sidebar-link', current && 'is-active')}
                aria-current={current ? 'page' : undefined}
                onClick={() => setDrawerOpen(false)}
              >
                <Icon aria-hidden="true" />
                {item.label}
              </NavLink>
            )
          })}
          <NavLink
            to="/about"
            className={clsx('sidebar-link', isCurrent(location.pathname, '/about') && 'is-active')}
            aria-current={isCurrent(location.pathname, '/about') ? 'page' : undefined}
            onClick={() => setDrawerOpen(false)}
          >
            <Info aria-hidden="true" />
            About this portal
          </NavLink>
        </nav>
        <div className="fp-drawer-actions">
          <button type="button" className="btn btn-secondary" onClick={safeSignOut}>
            <LogOut aria-hidden="true" /> Sign out
          </button>
        </div>
      </Drawer>
    </div>
  )
}
