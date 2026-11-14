import { historicalRainfall, seasonLabel } from '../data/historicalRainfall'
import { compareScenario, scenarioForSeason, type Scenario } from '../data/scenario'
import { formatSigned } from '../format'
import type { HistoricalSeasonSelection } from './HistoricalSeasonSelect'

export function SeasonComparison({ scenario, season }: { scenario: Scenario; season: HistoricalSeasonSelection }) {
  if (!historicalRainfall.provenance) return null

  const rows = historicalRainfall.seasons.map(({ startYear }) => ({
    startYear,
    difference: compareScenario(scenarioForSeason(scenario, season.year, startYear), startYear)
      .comparison?.dailyDifference,
  }))
  const magnitude = Math.max(...rows.map(({ difference }) => Math.abs(difference ?? 0))) || 1
  const hasBothDirections = rows.some(({ difference }) => (difference ?? 0) < 0)
    && rows.some(({ difference }) => (difference ?? 0) > 0)

  return (
    <section className="workspace-panel baseline-panel" aria-labelledby="season-comparison-title">
      <div className="baseline-heading">
        <h2 id="season-comparison-title">Five-season exposure comparison</h2>
        <p className="muted">NASA POWER / MERRA-2 · Later minus earlier, in mm-equivalent.</p>
        <p className="muted mt-2">Each season uses the same illustrative cover assumptions and return month and day. Different rainfall patterns can change which schedule has higher historical exposure.</p>
        {hasBothDirections && <p className="muted mt-2">The direction reverses across seasons for this scenario.</p>}
      </div>
      {rows.some(({ difference }) => difference === undefined) ? (
        <p className="analysis-error" role="status">Complete the managed-return inputs in the Planner to compare the five seasons.</p>
      ) : (
        <div>
          <div className="season-axis" aria-hidden="true"><span>← Later lower</span><span>0</span><span>Later higher →</span></div>
          <ul className="season-bars" aria-label="Select a NASA POWER season">
            {rows.map(({ startYear, difference }) => {
              if (difference === undefined) return null
              const width = Math.abs(difference) / magnitude * 50
              const direction = difference < 0 ? 'Later lower' : difference > 0 ? 'Later higher' : 'Equal exposure'
              return (
                <li key={startYear}>
                  <button type="button" aria-pressed={season.year === startYear}
                    aria-label={`${seasonLabel(startYear)}, ${formatSigned(difference)} mm-equivalent, ${direction}`}
                    onClick={() => season.onChange(startYear)}>
                    <span>{seasonLabel(startYear)}</span>
                    <span className="season-track" aria-hidden="true"><span className="season-bar"
                      style={{ width: `${width}%`, left: `${difference < 0 ? 50 - width : 50}%` }} /></span>
                    <strong>{formatSigned(difference)}</strong>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </section>
  )
}
