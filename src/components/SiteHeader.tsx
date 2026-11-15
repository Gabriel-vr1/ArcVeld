import { Menu, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { routes, type Page } from '../navigation'

export function SiteHeader({ page }: { page: Page }) {
  const [expanded, setExpanded] = useState(false)
  const toggle = useRef<HTMLButtonElement>(null)

  return (
    <header className="site-header" onKeyDown={(event) => {
      if (event.key === 'Escape' && expanded) {
        event.preventDefault()
        setExpanded(false)
        toggle.current?.focus()
      }
    }} onBlur={(event) => {
      if (expanded && event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setExpanded(false)
    }}>
      <a className="skip-link" href="#main-content" onClick={(event) => {
        event.preventDefault()
        document.getElementById('main-content')?.focus()
      }}>Skip to content</a>
      <div className="page-width header-inner">
        <a href={routes.overview.href} className="brand" aria-label="ArcVeld home">ArcVeld</a>
        <button className="site-menu-toggle" type="button" ref={toggle} aria-expanded={expanded} aria-controls="main-navigation"
          onClick={() => setExpanded((open) => !open)}>
          {expanded ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />} Menu
        </button>
        <nav id="main-navigation" className="site-nav" data-expanded={expanded} aria-label="Main navigation">
          {Object.values(routes).map(({ href, label }) => {
            const current = routes[page].href === href
            return <a key={href} href={href} aria-current={current ? 'page' : undefined} onClick={(event) => {
              if (!expanded || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return
              setExpanded(false)
              if (current) {
                event.preventDefault()
                toggle.current?.focus()
              }
            }}>{label}</a>
          })}
        </nav>
        <span className="header-event">NASA Space Apps <strong>2026</strong></span>
      </div>
    </header>
  )
}
