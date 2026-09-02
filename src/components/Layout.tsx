import type { ReactNode } from 'react'
import { useStore } from '../state/context.ts'

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
  const { state } = useStore()

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
          <a className="more-link nav-more-phone" href="#/more" aria-label="More">
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
    </div>
  )
}
