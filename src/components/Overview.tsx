import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { referenceWindow, referenceYear, researchReference } from '../data/researchReference'
import { historicalRainfall } from '../data/historicalRainfall'
import { formatNumber, formatShortDate } from '../format'
import { routes } from '../navigation'
import { KasunguMap } from './KasunguMap'
import { ButtonLink } from './ui/Button'

export function Overview() {
  const rain = historicalRainfall.seasons.find((season) => season.startYear === referenceYear)?.days

  return (
    <div className="page-width overview">
      <div className="overview-layout">
        <section className="overview-copy" aria-labelledby="overview-title">
          <p className="context-label">Kasungu, Central Malawi</p>
          <h1 id="overview-title">Agricultural Rotation Planning</h1>
          <p className="intro-text">Compare maize and groundnut rotations, then explore how the timing of residue return changes estimated ground cover during Malawi’s early rains.</p>
          <div className="actions">
            <ButtonLink href={routes.planner.href}>Open Rotation Planner <ArrowRight size={17} aria-hidden="true" /></ButtonLink>
            <ButtonLink href={routes.observations.href} variant="secondary">Explore Earth Observations</ButtonLink>
          </div>
        </section>
        <KasunguMap />
        {rain && <RainPreview rain={rain} />}
      </div>
    </div>
  )
}

function RainPreview({ rain }: { rain: NonNullable<typeof researchReference.days> }) {
  const peak = rain.reduce((largest, day) => day.rainMm > largest.rainMm ? day : largest)
  const total = rain.reduce((sum, day) => sum + day.rainMm, 0)
  const plotMax = Math.max(peak.rainMm, 1)

  return (
    <section className="rain-preview" aria-labelledby="rain-preview-title">
      <div className="rain-preview-heading">
        <div><h2 id="rain-preview-title">Daily precipitation</h2><p>{rain.length} UTC days · NASA POWER / MERRA-2</p></div>
        <a href={routes.observations.href} aria-label="Inspect historical rainfall"><ArrowUpRight size={19} aria-hidden="true" /></a>
      </div>
      <div className="rain-preview-value"><strong>{formatNumber(total)} <small>mm</small></strong><span>Period total</span></div>
      <svg viewBox="0 0 380 60" preserveAspectRatio="none" role="img" aria-label={`Daily rainfall. Peak of ${formatNumber(peak.rainMm)} mm on ${formatShortDate(peak.dateIso)}.`}>
        <path d="M0 59.5H380 M0 30H380" className="preview-gridline" />
        {rain.map(({ dateIso, rainMm }, index) => (
          <rect key={dateIso} x={index * 5} y={59 - (rainMm / plotMax) * 54}
            width="3.4" height={(rainMm / plotMax) * 54} className={dateIso === peak.dateIso ? 'preview-peak' : undefined} />
        ))}
      </svg>
      <div className="rain-preview-axis"><span>{formatShortDate(referenceWindow.startIso)}</span><span>{formatShortDate(referenceWindow.endIso)}</span></div>
    </section>
  )
}
