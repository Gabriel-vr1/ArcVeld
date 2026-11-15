import { historicalRainfall, seasonLabel } from '../data/historicalRainfall'
import { compareScenario, scenarioForSeason, type RainfallSource, type Scenario } from '../data/scenario'
import { comparisonTolerance } from '../domain/evidence'
import { formatSigned } from '../format'
import type { HistoricalSeasonSelection } from './HistoricalSeasonSelect'

export function SeasonComparison({ scenario, season, source, onSelect }: {
  scenario: Scenario
  season: HistoricalSeasonSelection
  source: RainfallSource
  onSelect: (year: number) => void
}) {
  if (!historicalRainfall.provenance) return null

  const rows = historicalRainfall.seasons.map(({ startYear }) => ({
    startYear,
    difference: compareScenario(scenarioForSeason(scenario, season.year, startYear), startYear)
      .comparison?.dailyDifference,
  }))
  const magnitude = Math.max(...rows.map(({ difference }) => Math.abs(difference ?? 0))) || 1
  const earlierLower = rows.filter(({ difference }) => (difference ?? 0) > comparisonTolerance)
  const laterLower = rows.filter(({ difference }) => (difference ?? 0) < -comparisonTolerance)
  const selected = rows.find(({ startYear }) => startYear === season.year)

  return (
    <section className="observation-comparison" aria-labelledby="season-comparison-title">
      <h3 id="season-comparison-title">Five-season exposure comparison</h3>
      <p className="muted">NASA POWER · Later minus earlier (mm-equivalent). Same return month/day and cover assumptions.</p>
      {rows.some(({ difference }) => difference === undefined) ? (
        <p className="analysis-error" role="status">Complete the managed-return inputs in the Planner to compare the five seasons.</p>
      ) : (
        <div>
          {earlierLower.length > 0 && laterLower.length > 0 && <p className="comparison-insight">
            Earlier return had lower estimated exposure in {earlierLower.map(({ startYear }) => seasonLabel(startYear)).join(', ')}. In {laterLower.length} other {laterLower.length === 1 ? 'season' : 'seasons'}, later return had lower exposure.
          </p>}
          <p className="muted">Select a season to view its POWER evidence in the timeline.</p>
          <div className="season-axis" aria-hidden="true"><span>← Later lower</span><span>0</span><span>Earlier lower →</span></div>
          <ul className="season-bars" aria-label="Select a NASA POWER season">
            {rows.map(({ startYear, difference }) => {
              if (difference === undefined) return null
              const value = Math.abs(difference) <= comparisonTolerance ? 0 : difference
              const width = Math.abs(value) / magnitude * 50
              const direction = value < 0 ? 'Later lower' : value > 0 ? 'Earlier lower' : 'Equal exposure'
              const signed = value !== 0 && Math.abs(value) < 0.005 ? `${value < 0 ? '−' : '+'}<0.01` : formatSigned(value)
              return (
                <li key={startYear}>
                  <button type="button" aria-pressed={source === 'power' && season.year === startYear}
                    aria-label={`${seasonLabel(startYear)}, ${signed} mm-equivalent, ${direction}`}
                    onClick={() => onSelect(startYear)}>
                    <span>{seasonLabel(startYear)}</span>
                    <span className="season-track" aria-hidden="true"><span className={value > 0 ? 'season-bar season-bar-positive' : 'season-bar'}
                      style={{ width: `${width}%`, left: `${value < 0 ? 50 - width : 50}%` }} /></span>
                    <strong>{signed}</strong>
                  </button>
                </li>
              )
            })}
          </ul>
          {selected && <p className="muted comparison-selection" role="status">Timeline: {seasonLabel(selected.startYear)} · {source === 'power' ? 'NASA POWER' : 'GPM IMERG'}</p>}
        </div>
      )}
    </section>
  )
}
