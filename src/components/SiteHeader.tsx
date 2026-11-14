import { Sprout } from 'lucide-react'

const navigation = [
  { href: '#overview', label: 'Overview' },
  { href: '#scenarios', label: 'Scenarios' },
  { href: '#nasa-analysis', label: 'NASA analysis' },
  { href: '#sources', label: 'Sources & methods' },
] as const

export function SiteHeader() {
  return (
    <header className="site-header">
      <a className="skip-link" href="#overview">Skip to content</a>
      <div className="page-width header-inner">
        <a href="#overview" className="brand" aria-label="ArcVeld home">
          <span className="brand-mark"><Sprout size={21} aria-hidden="true" /></span>
          ArcVeld
        </a>
        <nav aria-label="Main navigation">
          {navigation.map(({ href, label }) => <a key={href} href={href}>{label}</a>)}
        </nav>
        <span className="header-event">NASA Space Apps Challenge 2026</span>
      </div>
    </header>
  )
}
