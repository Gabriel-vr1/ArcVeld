import { Sprout } from 'lucide-react'
import { CropSequence } from './components/CropSequence'
import { NASAComparison } from './components/NASAComparison'
import { Overview } from './components/Overview'
import { SiteHeader } from './components/SiteHeader'
import { SourcePanel } from './components/SourcePanel'

export default function App() {
  return (
    <>
      <SiteHeader />
      <main id="overview" tabIndex={-1}>
        <Overview />
        <CropSequence />
        <NASAComparison />
        <SourcePanel />
      </main>
      <footer className="site-footer">
        <div className="page-width footer-inner">
          <a className="footer-brand" href="#overview"><Sprout size={19} aria-hidden="true" /> ArcVeld</a>
          <span>Field Shift · NASA Space Apps Challenge 2026</span>
        </div>
      </footer>
    </>
  )
}
