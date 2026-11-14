import { ArrowUpRight, CalendarRange, CloudRain, Info } from 'lucide-react'
import { Badge } from './ui/Badge'

export function NASAComparison() {
  return (
    <section id="nasa-analysis" aria-labelledby="nasa-title" className="analysis-section" tabIndex={-1}>
      <div className="page-width content-section">
        <div className="section-heading">
          <p className="eyebrow"><CloudRain size={17} aria-hidden="true" /> NASA analysis</p>
          <h2 id="nasa-title">When rain meets uncovered soil</h2>
          <p>The planned comparison uses calendar cover, uniform rainfall, and historical daily rainfall for the same window.</p>
        </div>

        <div className="analysis-grid">
          <article className="analysis-card">
            <span className="scenario-icon scenario-icon-green"><CalendarRange size={21} aria-hidden="true" /></span>
            <h3>Without daily NASA timing</h3>
            <p className="card-description">Compare uncovered area-days and a baseline that spreads the season’s rainfall evenly across the window.</p>
          </article>
          <article className="analysis-card analysis-card-rain">
            <span className="scenario-icon scenario-icon-rain"><CloudRain size={21} aria-hidden="true" /></span>
            <h3>With historical NASA data</h3>
            <p className="card-description">Use dated rainfall to compare how much regional rain coincides with estimated uncovered ground in each scenario.</p>
          </article>
        </div>

        <div className="analysis-status">
          <Info size={19} className="status-icon" aria-hidden="true" />
          <div>
            <Badge tone="rain">Analysis unavailable</Badge>
            <p>This foundation shows the comparison methods. Historical rainfall and exposure results will appear once the calculation and rainfall series are integrated.</p>
          </div>
          <a className="text-link" href="#sources">See data provenance <ArrowUpRight size={15} aria-hidden="true" /></a>
        </div>
      </div>
    </section>
  )
}
