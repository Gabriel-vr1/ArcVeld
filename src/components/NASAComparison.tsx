import { ArrowRight, CalendarDays, Info } from 'lucide-react'
import { formatNumber, formatSigned, formatWindow } from '../format'
import { formatScientificClaim } from '../domain/scientificClaim'
import type { compareScenario, Scenario } from '../data/scenario'
import { routes } from '../navigation'
import { ObservationChart } from './ObservationChart'
import { ButtonLink } from './ui/Button'
import { referenceProvenance, type referenceWindow } from '../data/researchReference'
import { rainfallLabel } from '../data/historicalRainfall'
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
  const claim = comparison && formatScientificClaim(comparison)

  return (
    <div className="page-width page-body observations">
      <header className="page-heading">
        <div>
          <h1>Earth Observations</h1>
          <p>Kasungu, Malawi · {source === 'imerg' ? imergLabel : rainfallLabel}</p>
        </div>
        <div className="season-controls">
          <HistoricalSeasonSelect {...season} />
          <RainfallSourceSelect year={season.year} source={source} onSourceChange={onSourceChange} />
          <ButtonLink variant="secondary" href={routes.planner.href}>Edit scenario <ArrowRight size={16} aria-hidden="true" /></ButtonLink>
        </div>
      </header>
      <div className="observation-meta">
        <span><CalendarDays size={16} aria-hidden="true" /> {formatWindow(window)} · UTC</span>
        <span className="technical">{source === 'imerg' ? 'precipitation · 0.1° grid' : 'PRECTOTCORR'}</span>
        <span className="technical">{Math.abs(referenceProvenance.queryLat).toFixed(2)}° S, {referenceProvenance.queryLon.toFixed(2)}° E</span>
        <span>Managed residue return · Illustrative ground cover</span>
        <a href={challengeResources.url}>POWER listed in Field Shift Resources</a>
        <a href={routes.research.href}>See data provenance</a>
      </div>
      {comparison ? (
        <>
          <dl className="observation-stats">
            <div><dt>Period rainfall</dt><dd>{formatNumber(comparison.totalRainMm)} <small>mm</small></dd></div>
            <div><dt>Daily exposure · earlier</dt><dd>{formatNumber(comparison.early.dailyExposure)} <small>mm-equivalent</small></dd></div>
            <div><dt>Daily exposure · later</dt><dd>{formatNumber(comparison.late.dailyExposure)} <small>mm-equivalent</small></dd></div>
            <div className="observation-delta"><dt>Later minus earlier</dt><dd>{formatSigned(comparison.dailyDifference)} <small>mm-equivalent</small></dd></div>
          </dl>
          <ObservationChart events={comparison.events} scenario={scenario} selectedDate={selectedDate} onDateSelect={onDateSelect} />

          <section className="workspace-panel baseline-panel" aria-labelledby="baseline-title">
            <div className="baseline-heading">
              <h2 id="baseline-title">Calendar and rainfall comparison</h2>
              {claim && <p className="claim" role="status"><Info size={17} aria-hidden="true" /><span><strong>{claim.title}</strong> {claim.detail}</span></p>}
            </div>
            <table className="comparison-table">
              <caption className="sr-only">Calendar, uniform and historical daily rainfall exposure</caption>
              <thead><tr><th scope="col">Measure</th><th scope="col">Earlier</th><th scope="col">Later</th></tr></thead>
              <tbody>
                <tr><th scope="row">Calendar <small>Uncovered area-days</small></th><td>{comparison.early.uncoveredAreaDays.toFixed(3)}</td><td>{comparison.late.uncoveredAreaDays.toFixed(3)}</td></tr>
                <tr><th scope="row">Uniform rainfall <small>mm-equivalent</small></th><td>{formatNumber(comparison.early.uniformExposure)}</td><td>{formatNumber(comparison.late.uniformExposure)}</td></tr>
                <tr className="daily-comparison"><th scope="row">Historical daily rainfall <small>mm-equivalent</small></th><td>{formatNumber(comparison.early.dailyExposure)}</td><td>{formatNumber(comparison.late.dailyExposure)}</td></tr>
              </tbody>
            </table>
          </section>
        </>
      ) : <p className="analysis-error" role="status"><strong>Analysis unavailable.</strong> {error}</p>}
      <RainfallSourceComparison scenario={scenario} year={season.year} />
      <SeasonComparison scenario={scenario} season={season} />
      <p className="observation-limit">This historical exposure proxy uses regional rainfall and illustrative cover. Erosion, runoff, crop yield and future conditions are outside the scope of the calculation.</p>
    </div>
  )
}
