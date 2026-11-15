import { ArrowRight, Info } from 'lucide-react'
import { useRef } from 'react'
import { formatNumber, formatSigned, formatWindow } from '../format'
import { formatScientificClaim } from '../domain/scientificClaim'
import type { compareScenario, Scenario } from '../data/scenario'
import { routes } from '../navigation'
import { ObservationChart } from './ObservationChart'
import { ButtonLink } from './ui/Button'
import { referenceProvenance, type referenceWindow } from '../data/researchReference'
import { rainfallLabel, seasonLabel } from '../data/historicalRainfall'
import { comparisonTolerance } from '../domain/evidence'
import { imergLabel } from '../data/imergRainfall'
import challengeResources from '../data/challengeResources.json'
import { HistoricalSeasonSelect, type HistoricalSeasonSelection } from './HistoricalSeasonSelect'
import { SeasonComparison } from './SeasonComparison'
import { RainfallSourceSelect, type RainfallSourceSelection } from './RainfallSourceSelect'
import { RainfallSourceComparison } from './RainfallSourceComparison'

export function NASAComparison({ scenario, analysis, selectedDate, onDateSelect, season, window, source, onSourceChange }: {
  scenario: Scenario
  analysis: ReturnType<typeof compareScenario>
  selectedDate?: string
  onDateSelect: (date: string) => void
  season: HistoricalSeasonSelection
  window: typeof referenceWindow
} & RainfallSourceSelection) {
  const { comparison, error } = analysis
  const timelineTitle = useRef<HTMLHeadingElement>(null)
  const claim = comparison && formatScientificClaim(comparison)
  const difference = comparison?.dailyDifference ?? 0
  const direction = Math.abs(difference) <= comparisonTolerance ? 'Both schedules have equal estimated exposure'
    : difference < 0 ? 'Later return had lower estimated exposure' : 'Earlier return had lower estimated exposure'
  const signedDifference = Math.abs(difference) > comparisonTolerance && Math.abs(difference) < 0.005
    ? (difference < 0 ? '\u2212<0.01' : '+<0.01') : formatSigned(difference)

  return (
    <div className="page-width page-body observations">
      <header className="page-heading">
        <div>
          <h1>Earth Observations</h1>
          <p>Explore historical rainfall alongside illustrative ground cover.</p>
        </div>
        <div className="season-controls">
          <HistoricalSeasonSelect {...season} />
          <RainfallSourceSelect year={season.year} source={source} onSourceChange={onSourceChange} compact />
          <ButtonLink variant="secondary" href={routes.planner.href}>Edit scenario <ArrowRight size={16} aria-hidden="true" /></ButtonLink>
        </div>
      </header>
      <section className="workspace-panel observation-workspace" aria-labelledby="timeline-title">
        <div className="observation-context">
          <p className="context-label">Kasungu, Malawi · {seasonLabel(season.year)}</p>
          <h2 id="timeline-title" tabIndex={-1} ref={timelineTitle}>Rainfall and ground cover</h2>
          <p className="muted">{formatWindow(window)} · UTC · {source === 'imerg' ? imergLabel : rainfallLabel}</p>
        </div>
        {comparison ? <>
          <div className="observation-outcome" role="status">
            <p><strong>{direction}.</strong> <span>Later minus earlier: <b>{signedDifference} mm-equivalent</b></span></p>
            <p><strong>{formatNumber(comparison.totalRainMm)} mm</strong> season rainfall</p>
          </div>
          <ObservationChart events={comparison.events} scenario={scenario} selectedDate={selectedDate} onDateSelect={onDateSelect} />
        </> : <p className="analysis-error" role="status"><strong>Analysis unavailable.</strong> {error}</p>}
      </section>
      <section className="observation-history" aria-labelledby="history-title">
        <div className="observation-history-heading">
          <h2 id="history-title">Compare the historical record</h2>
          <button className="text-link" type="button" onClick={() => timelineTitle.current?.focus()}>Back to timeline</button>
        </div>
        <div className="observation-comparisons">
          <SeasonComparison scenario={scenario} season={season} source={source} onSelect={(year) => {
            season.onChange(year)
            onSourceChange('power')
          }} />
          <RainfallSourceComparison scenario={scenario} year={season.year} source={source} onSourceChange={onSourceChange} />
        </div>
      </section>

      <section className="observation-method" aria-labelledby="observation-method-title">
        <h2 id="observation-method-title">Method and limitations</h2>
        <p className="observation-limit">Rainfall is a regional NASA estimate. Ground cover is modelled from illustrative assumptions; field feasibility is assessed separately in the Planner. The rainfall-weighted exposure proxy (mm-equivalent) does not measure erosion, runoff, crop yield or soil health, and does not forecast future conditions.</p>
        {comparison && (
          <details className="daily-data">
            <summary>Calendar and rainfall baselines</summary>
            {claim && <p className="claim"><Info size={17} aria-hidden="true" /><span><strong>{claim.title}</strong> {claim.detail}</span></p>}
            <table className="comparison-table">
              <caption className="sr-only">Calendar, uniform and historical daily rainfall exposure</caption>
              <thead><tr><th scope="col">Measure</th><th scope="col">Earlier</th><th scope="col">Later</th></tr></thead>
              <tbody>
                <tr><th scope="row">Calendar <small>Uncovered area-days</small></th><td>{comparison.early.uncoveredAreaDays.toFixed(3)}</td><td>{comparison.late.uncoveredAreaDays.toFixed(3)}</td></tr>
                <tr><th scope="row">Uniform rainfall <small>mm-equivalent</small></th><td>{formatNumber(comparison.early.uniformExposure)}</td><td>{formatNumber(comparison.late.uniformExposure)}</td></tr>
                <tr className="daily-comparison"><th scope="row">Historical daily rainfall <small>mm-equivalent</small></th><td>{formatNumber(comparison.early.dailyExposure)}</td><td>{formatNumber(comparison.late.dailyExposure)}</td></tr>
              </tbody>
            </table>
          </details>
        )}
        <details className="daily-data">
          <summary>Rainfall product and coordinates</summary>
          <div className="observation-meta">
            <span className="technical">{source === 'imerg' ? 'precipitation · 0.1° grid' : 'PRECTOTCORR'}</span>
            <span className="technical">{Math.abs(referenceProvenance.queryLat).toFixed(2)}° S, {referenceProvenance.queryLon.toFixed(2)}° E</span>
            <a href={challengeResources.url}>POWER listed in Field Shift Resources</a>
          </div>
        </details>
        <a className="text-link observation-provenance" href={routes.research.href}>See data provenance</a>
      </section>
    </div>
  )
}
