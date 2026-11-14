import { routes, type Page } from '../navigation'

export function SiteHeader({ page }: { page: Page }) {
  return (
    <header className="site-header">
      <a className="skip-link" href="#main-content" onClick={(event) => {
        event.preventDefault()
        document.getElementById('main-content')?.focus()
      }}>Skip to content</a>
      <div className="page-width header-inner">
        <a href={routes.overview.href} className="brand" aria-label="ArcVeld home">ArcVeld</a>
        <nav aria-label="Main navigation">
          {Object.values(routes).map(({ href, label }) => (
            <a key={href} href={href} aria-current={routes[page].href === href ? 'page' : undefined}>{label}</a>
          ))}
        </nav>
        <span className="header-event">NASA Space Apps <strong>2026</strong></span>
      </div>
    </header>
  )
}
