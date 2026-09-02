import type { ReactNode } from 'react'
import { useStore } from '../state/context.ts'

const TABS = [
  { page: 'unused' as const, label: 'Unused', hash: '#/unused' },
  { page: 'sites' as const, label: 'Sites', hash: '#/sites' },
  { page: 'hives' as const, label: 'Hives', hash: '#/hives' },
]

export function Layout({
  title,
  subtitle,
  back,
  children,
  actions,
}: {
  title: string
  subtitle?: string
  back?: { label: string; href: string }
  children: ReactNode
  actions?: ReactNode
}) {
  const { route, state } = useStore()
  const active =
    route.page === 'site' || route.page === 'sites'
      ? 'sites'
      : route.page === 'hive' || route.page === 'hives'
        ? 'hives'
        : route.page === 'more'
          ? 'more'
          : 'unused'

  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar-row">
          {back ? (
            <a className="back" href={back.href}>
              {back.label}
            </a>
          ) : (
            <p className="eyebrow">{state.appName}</p>
          )}
          <a className="more-link" href="#/more" aria-label="More">
            More
          </a>
        </div>
        <div className="title-row">
          <h1>{title}</h1>
          {actions}
        </div>
        {subtitle ? <p className="lede">{subtitle}</p> : null}
      </header>
      <main className="main">{children}</main>
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
