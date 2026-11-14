import { useEffect, useMemo, useRef, useState } from 'react'
import { NASAComparison } from './components/NASAComparison'
import { Overview } from './components/Overview'
import { RotationPlanner, type ManagementOption } from './components/RotationPlanner'
import { SiteHeader } from './components/SiteHeader'
import { SourcePanel } from './components/SourcePanel'
import { Welcome } from './components/Welcome'
import { compareScenario, initialConstraints, initialScenario, type Constraints, type Scenario } from './data/scenario'
import { routes, usePage } from './navigation'

export default function App() {
  const page = usePage()
  const main = useRef<HTMLElement>(null)
  const previousPage = useRef(page)
  const [scenario, setScenario] = useState<Scenario>(initialScenario)
  const [constraints, setConstraints] = useState<Constraints>(initialConstraints)
  const [management, setManagement] = useState<ManagementOption>('managed')
  const [selectedDate, setSelectedDate] = useState<string>()
  const analysis = useMemo(() => compareScenario(scenario), [scenario])

  useEffect(() => {
    document.title = page === 'welcome' ? 'ArcVeld · Earth Observation for Agricultural Planning' : `${routes[page].title} · ArcVeld`
    if (previousPage.current !== page) {
      window.scrollTo(0, 0)
      main.current?.focus({ preventScroll: true })
      previousPage.current = page
    }
  }, [page])

  return (
    <>
      {page !== 'welcome' && <SiteHeader page={page} />}
      <main id="main-content" ref={main} tabIndex={-1}>
        {page === 'welcome' && <Welcome />}
        {page === 'overview' && <Overview />}
        {page === 'planner' && (
          <RotationPlanner scenario={scenario} onScenarioChange={setScenario}
            constraints={constraints} onConstraintsChange={setConstraints} analysis={analysis}
            management={management} onManagementChange={setManagement} />
        )}
        {page === 'observations' && (
          <NASAComparison scenario={scenario} analysis={analysis}
            selectedDate={selectedDate} onDateSelect={setSelectedDate} />
        )}
        {page === 'research' && <SourcePanel />}
      </main>
      {page !== 'welcome' && (
        <footer className="site-footer">
          <div className="page-width footer-inner">
            <a className="footer-brand" href={routes.overview.href}>ArcVeld</a>
            <span>NASA Space Apps Challenge 2026 <span aria-hidden="true">·</span> Field Shift</span>
            <a href={routes.research.href}>Sources &amp; methodology</a>
          </div>
        </footer>
      )}
    </>
  )
}
