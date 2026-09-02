import { useState, type ReactNode } from 'react'
import { HOME_YARD } from '../domain/seed.ts'
import { useWideLayout } from '../hooks/useWideLayout.ts'
import { useStore } from '../state/context.ts'
import { SiteMapPanel } from './SiteMapPanel.tsx'

const TABS = [
  { page: 'unused' as const, label: 'Unused', hash: '#/unused' },
  { page: 'sites' as const, label: 'Sites', hash: '#/sites' },
  { page: 'hives' as const, label: 'Hives', hash: '#/hives' },
  { page: 'inspections' as const, label: 'Inspect', hash: '#/inspections' },
]

export function AppShell({ children }: { children: ReactNode }) {
  const { route, state } = useStore()
  const wide = useWideLayout()
  const derivedSiteId = siteIdForRoute(route, state)
  const selectedHiveId =
    route.page === 'hive' || route.page === 'inspect' ? route.hiveId : null
  const [pinnedSiteId, setPinnedSiteId] = useState<string | null>(null)
  const [syncedSiteId, setSyncedSiteId] = useState(derivedSiteId)
  if (syncedSiteId !== derivedSiteId) {
    setSyncedSiteId(derivedSiteId)
    setPinnedSiteId(null)
  }
  const mapSiteId = pinnedSiteId ?? derivedSiteId
  const showMap = route.page !== 'more'

  const active =
    route.page === 'site' || route.page === 'sites'
      ? 'sites'
      : route.page === 'hive' || route.page === 'hives'
        ? 'hives'
        : route.page === 'inspections' || route.page === 'inspect'
          ? 'inspections'
          : route.page === 'more'
          ? 'more'
          : 'unused'

  return (
    <div className={wide ? 'app is-wide' : 'app'}>
      <header className="nav-wide">
        <p className="nav-brand">{state.appName}</p>
        <nav className="nav-wide-tabs" aria-label="Primary">
          {TABS.map((tab) => (
            <a
              key={tab.page}
              href={tab.hash}
              className={active === tab.page ? 'tab is-active' : 'tab'}
              aria-current={active === tab.page ? 'page' : undefined}
            >
              {tab.label}
            </a>
          ))}
        </nav>
        <a className="more-link" href="#/more">
          More
        </a>
      </header>

      <div className={showMap ? 'workspace' : 'workspace is-single'}>
        <section className="pane-main">{children}</section>
        {showMap ? (
          <section className="pane-map" aria-label="Site aerial">
            <SiteMapPanel
              siteId={mapSiteId}
              selectedHiveId={selectedHiveId}
              showSiteSwitch
              onSelectSite={setPinnedSiteId}
            />
          </section>
        ) : null}
      </div>

      <nav className="tabbar" aria-label="Primary">
        {TABS.map((tab) => (
          <a
            key={tab.page}
            href={tab.hash}
            className={active === tab.page ? 'tab is-active' : 'tab'}
            aria-current={active === tab.page ? 'page' : undefined}
          >
            {tab.label}
          </a>
        ))}
      </nav>
    </div>
  )
}

function siteIdForRoute(
  route: { page: string; siteId?: string; hiveId?: string },
  state: { hives: { id: string; siteId: string }[] },
): string {
  if (route.page === 'site' && route.siteId) return route.siteId
  if (route.page === 'hive' && route.hiveId) {
    return state.hives.find((hive) => hive.id === route.hiveId)?.siteId ?? HOME_YARD
  }
  if (route.page === 'inspect' && route.hiveId) {
    return state.hives.find((hive) => hive.id === route.hiveId)?.siteId ?? HOME_YARD
  }
  return HOME_YARD
}
