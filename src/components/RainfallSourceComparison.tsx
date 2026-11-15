import { formatNumber, formatSigned } from '../format'
import { compareScenario, type RainfallSource, type Scenario } from '../data/scenario'
import { comparisonTolerance } from '../domain/evidence'
import { historicalRainfall } from '../data/historicalRainfall'
import { imergLabel, imergRainfall } from '../data/imergRainfall'
import { referenceYear } from '../data/researchReference'

function exposureDirection(difference: number) {
  if (Math.abs(difference) <= comparisonTolerance) return 0
  return Math.sign(difference)
}

export function RainfallSourceComparison({ scenario, year, source, onSourceChange }: {
  scenario: Scenario
  year: number
  source: RainfallSource
  onSourceChange: (source: RainfallSource) => void
}) {
  if (year !== referenceYear || !historicalRainfall.provenance || !imergRainfall.days) return null
  const power = compareScenario(scenario, year).comparison
  const imerg = compareScenario(scenario, year, 'imerg').comparison
  if (!power || !imerg) return null
  const powerDirection = exposureDirection(power.dailyDifference)
  const imergDirection = exposureDirection(imerg.dailyDifference)
  const agreement = powerDirection !== imergDirection ? 'The products differ on which schedule has lower estimated exposure.'
    : powerDirection === 0 ? 'Both products show equal estimated exposure for the two schedules.'
      : `Both products show lower estimated exposure for ${powerDirection < 0 ? 'later' : 'earlier'} return.`
  const magnitude = powerDirection === imergDirection && powerDirection !== 0
    && formatNumber(Math.abs(power.dailyDifference)) !== formatNumber(Math.abs(imerg.dailyDifference))
    ? ' The size of the difference varies by product.' : ''

  const measures = [
    ['Total precipitation', 'mm', formatNumber(power.totalRainMm), formatNumber(imerg.totalRainMm)],
    ['Earlier exposure', 'mm-equivalent', formatNumber(power.early.dailyExposure), formatNumber(imerg.early.dailyExposure)],
    ['Later exposure', 'mm-equivalent', formatNumber(power.late.dailyExposure), formatNumber(imerg.late.dailyExposure)],
    ['Later minus earlier', 'mm-equivalent', formatSigned(power.dailyDifference), formatSigned(imerg.dailyDifference)],
  ]

  return (
    <section className="observation-comparison" aria-labelledby="source-comparison-title">
      <h3 id="source-comparison-title">POWER and IMERG comparison</h3>
      <p className="muted">2022/23 only · Same 76 UTC days, dates and cover assumptions.</p>
      <p className="comparison-insight">{agreement}{magnitude}</p>
      <p className="muted">Select a product to update the timeline.</p>
      <table className="comparison-table">
        <thead><tr><th scope="col">Measure</th>
          <th scope="col"><button type="button" aria-pressed={source === 'power'} onClick={() => onSourceChange('power')}>NASA POWER</button></th>
          <th scope="col"><button type="button" aria-label={imergLabel} aria-pressed={source === 'imerg'} onClick={() => onSourceChange('imerg')}>GPM IMERG</button></th>
        </tr></thead>
        <tbody>
          {measures.map(([label, units, powerValue, imergValue]) => (
            <tr key={label}><th scope="row">{label} <small>{units}</small></th><td>{powerValue}</td><td>{imergValue}</td></tr>
          ))}
        </tbody>
      </table>
      <p className="muted">POWER uses MERRA-2 reanalysis. IMERG combines satellite retrievals with gauge adjustment on a different grid. These regional estimates do not verify rainfall at a particular farm.</p>
    </section>
  )
}
