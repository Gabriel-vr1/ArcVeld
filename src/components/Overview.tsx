import { ArrowRight, ArrowUpRight } from 'lucide-react'
import type { ManagementOption } from './RotationPlanner'
import { referenceYear, type referenceWindow } from '../data/researchReference'
import { historicalRainfall, rainfallLabel, seasonLabel } from '../data/historicalRainfall'
import { imergLabel, imergRainfall } from '../data/imergRainfall'
import type { compareScenario, RainfallSource } from '../data/scenario'
import { comparisonTolerance, type RainDay } from '../domain/evidence'
import { formatNumber, formatShortDate } from '../format'
import { routes } from '../navigation'
import { KasunguMap } from './KasunguMap'
import { ButtonLink } from './ui/Button'

const practiceLabels = {
  managed: 'Managed groundnut-residue return',
  ordinary: 'Ordinary groundnut rotation',
  current: 'Existing maize management',
} satisfies Record<ManagementOption, string>

export function Overview({ year, source, window, analysis, management }: {
  year: number
  source: RainfallSource
  window: typeof referenceWindow
  analysis: ReturnType<typeof compareScenario>
  management: ManagementOption
}) {
  const rain = source === 'imerg'
    ? (year === referenceYear ? imergRainfall.days : undefined)
    : historicalRainfall.seasons.find((season) => season.startYear === year)?.days
  const sourceLabel = source === 'imerg' ? imergLabel : rainfallLabel
  const difference = analysis.comparison?.dailyDifference
  const tied = difference !== undefined && Math.abs(difference) <= comparisonTolerance
  const magnitude = difference === undefined ? '' : Math.abs(difference) < 0.005
    ? 'less than 0.01' : formatNumber(Math.abs(difference))

  return (
    <div className="page-width overview">
      <header className="overview-heading">
        <div>
          <p className="context-label">Kasungu, Central Malawi</p>
          <h1>Agricultural Rotation Planning</h1>
          <p className="muted">Explore how residue-return timing changes modelled ground cover and exposure to historical rainfall.</p>
        </div>
        <ButtonLink href={routes.planner.href}>Open Rotation Planner <ArrowRight size={17} aria-hidden="true" /></ButtonLink>
      </header>
      <div className="overview-layout">
        <KasunguMap />
        <aside className="overview-context" aria-label="Current investigation">
          <section aria-labelledby="investigation-title">
            <h2 id="investigation-title">Current investigation</h2>
            <p className="overview-practice">{practiceLabels[management]}</p>
            <p className="context-label">{seasonLabel(year)} · {sourceLabel}</p>
            <div className="overview-outcome">
              {management !== 'managed' ? <p>Field cover observations are needed to quantify this practice.</p>
                : difference === undefined ? <p>Comparison unavailable. Review the scenario inputs in the Planner.</p>
                  : <>
                    <p>{tied ? 'Both return dates had equal estimated exposure.' : (
                      <>{difference < 0 ? 'Later' : 'Earlier'} return had <strong>{magnitude} mm-equivalent</strong> lower estimated exposure.</>
                    )}</p>
                    <p className="overview-proxy">Historical rainfall-weighted proxy with illustrative cover.</p>
                  </>}
            </div>
          </section>
          {rain?.length ? <RainPreview rain={rain} window={window} />
            : <p className="muted">Rainfall preview is unavailable for this selection.</p>}
          <a className="text-link" href={routes.observations.href}>Explore Earth Observations <ArrowUpRight size={15} aria-hidden="true" /></a>
        </aside>
      </div>
    </div>
  )
}

function RainPreview({ rain, window }: { rain: readonly RainDay[]; window: typeof referenceWindow }) {
  const peak = rain.reduce((largest, day) => day.rainMm > largest.rainMm ? day : largest)
  const total = rain.reduce((sum, day) => sum + day.rainMm, 0)
  const plotMax = Math.max(peak.rainMm, 1)
  const chartWidth = rain.length * 5

  return (
    <section className="rain-preview" aria-labelledby="rain-preview-title">
      <h2 id="rain-preview-title">Historical precipitation</h2>
      <p className="rain-preview-value"><strong>{formatNumber(total)} mm</strong> total · {rain.length} UTC days</p>
      <svg viewBox={`0 0 ${chartWidth} 60`} preserveAspectRatio="none" role="img"
        aria-label={`Daily rainfall. Peak of ${formatNumber(peak.rainMm)} mm on ${formatShortDate(peak.dateIso)}.`}>
        <path d={`M0 59.5H${chartWidth} M0 30H${chartWidth}`} className="preview-gridline" />
        {rain.map(({ dateIso, rainMm }, index) => (
          <rect key={dateIso} x={index * 5} y={59 - (rainMm / plotMax) * 54}
            width="3.4" height={(rainMm / plotMax) * 54} className={dateIso === peak.dateIso ? 'preview-peak' : undefined} />
        ))}
      </svg>
      <div className="rain-preview-axis">
        <span>{formatShortDate(window.startIso)}</span><span>{formatShortDate(window.endIso)}</span>
      </div>
    </section>
  )
}
