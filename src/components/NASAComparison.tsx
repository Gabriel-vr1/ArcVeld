import { ArrowRight, Info } from 'lucide-react'
import { useRef } from 'react'
import { formatDate, formatNumber, formatSigned, formatWindow } from '../format'
import { formatScientificClaim } from '../domain/scientificClaim'
import type { compareScenario, Scenario } from '../data/scenario'
import { routes } from '../navigation'
import { ObservationChart, ObservationDailyTable } from './ObservationChart'
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
import { MalawiLocator } from './MalawiLocator'
import satellite from '../assets/kasungu-landsat9.webp'
import landsat from '../data/landsatKasungu.json'

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
  const events = comparison?.events ?? []
  const topEvents = events.filter(({ contribution }) => Math.abs(contribution) > comparisonTolerance)
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)).slice(0, 3)
  const selected = events.find((event) => event.dateIso === selectedDate) ?? topEvents[0] ?? events[0]
  const claim = comparison && formatScientificClaim(comparison)
  const difference = comparison?.dailyDifference ?? 0
  const direction = Math.abs(difference) <= comparisonTolerance ? 'Both schedules have equal estimated exposure'
    : difference < 0 ? 'Later return had lower estimated exposure' : 'Earlier return had lower estimated exposure'
  const signedDifference = Math.abs(difference) > comparisonTolerance && Math.abs(difference) < 0.005
    ? (difference < 0 ? '\u2212<0.01' : '+<0.01') : formatSigned(difference)

  return (
    <div className="observations">
      <header className="observation-masthead">
        <div className="observation-scene">
          <img src={satellite} width={landsat.width} height={landsat.height} alt="" />
          <MalawiLocator />
          <span>{landsat.mission} · {formatDate(landsat.acquiredOn)} · Kasungu study area</span>
        </div>
        <div className="page-width observation-masthead-content">
          <p className="context-label">Kasungu, Malawi</p>
          <h1>Earth Observations</h1>
          <div className="season-controls">
            <HistoricalSeasonSelect {...season} />
            <RainfallSourceSelect year={season.year} source={source} onSourceChange={onSourceChange} compact />
            <ButtonLink variant="secondary" href={routes.planner.href}>Edit scenario <ArrowRight size={16} aria-hidden="true" /></ButtonLink>
          </div>
        </div>
      </header>
      <section className="page-width observation-workspace" aria-labelledby="timeline-title">
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
          <ObservationChart events={comparison.events} scenario={scenario} selected={selected} topEvents={topEvents} onDateSelect={onDateSelect} />
        </> : <p className="analysis-error" role="status"><strong>Analysis unavailable.</strong> {error}</p>}
      </section>
      <section className="page-width observation-history" aria-labelledby="history-title">
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

      <section className="page-width observation-method" aria-labelledby="observation-method-title">
        <h2 id="observation-method-title">Daily data and methodology</h2>
        {comparison && <ObservationDailyTable events={comparison.events} selectedDate={selected.dateIso} onDateSelect={onDateSelect} />}
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
        <p className="observation-limit">Rainfall is a regional NASA estimate. Ground cover is modelled from illustrative assumptions; field feasibility is assessed in the Planner. The rainfall-weighted exposure proxy does not measure erosion, runoff, crop yield or soil health, and does not forecast future conditions.</p>
        <a className="text-link observation-provenance" href={routes.research.href}>See data provenance</a>
      </section>
    </div>
  )
}
