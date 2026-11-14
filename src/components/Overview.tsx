import { ArrowDownRight, ArrowRight, CloudRain, MapPin, Sprout } from 'lucide-react'
import { referenceWindow, researchReference } from '../data/researchReference'
import type { Comparison } from '../data/scenario'
import { formatNumber } from '../format'
import { routes } from '../navigation'
import { KasunguMap } from './KasunguMap'
import { ButtonLink } from './ui/Button'

export function Overview({ comparison }: { comparison?: Comparison }) {
  const rain = researchReference.days
  const maxRain = rain ? Math.max(1, ...rain.map(({ rainMm }) => rainMm)) : 1

  return (
    <div className="page-width overview">
      <section className="overview-intro" aria-labelledby="overview-title">
        <div className="overview-copy">
          <p className="location-label"><MapPin size={15} aria-hidden="true" /> Kasungu, Central Malawi</p>
          <h1 id="overview-title">Agricultural<br className="overview-break" /> Rotation Planning</h1>
          <p className="intro-text">Explore how crop rotation and the timing of residue return could affect soil cover during Malawi’s early rains.</p>
          <div className="actions">
            <ButtonLink href={routes.planner.href}>Open Rotation Planner <ArrowRight size={16} aria-hidden="true" /></ButtonLink>
            <ButtonLink href={routes.observations.href} variant="secondary">Explore NASA Data</ButtonLink>
          </div>
        </div>
        <KasunguMap />
      </section>

      <dl className="reference-strip" aria-label="Reference study">
        <div><dt>Historical window</dt><dd>1 Nov 2022 – 15 Jan 2023</dd></div>
        <div><dt>Daily rainfall record</dt><dd>{rain ? `${referenceWindow.dates.length} UTC days` : 'Unavailable'}</dd></div>
        <div><dt>Rainfall source</dt><dd>NASA POWER / MERRA-2</dd></div>
      </dl>

      <section className="overview-workspaces" aria-label="Planning and observation workflows">
        <a className="workspace-preview" href={routes.planner.href}>
          <span className="preview-icon"><Sprout size={20} aria-hidden="true" /></span>
          <div>
            <h2>Rotation Planner</h2>
            <p>Compare crop sequences and test two residue-return schedules.</p>
            <span className="mini-sequence">Groundnut <ArrowRight size={13} aria-hidden="true" /> Maize</span>
          </div>
          <ArrowDownRight className="preview-arrow" size={20} aria-hidden="true" />
        </a>
        <a className="workspace-preview" href={routes.observations.href}>
          <span className="preview-icon preview-rain"><CloudRain size={20} aria-hidden="true" /></span>
          <div>
            <h2>Earth Observations</h2>
            <p>See how daily rainfall overlaps with estimated ground cover.</p>
            {rain && (
              <span className="mini-rain">
                <svg width="130" height="26" viewBox="0 0 152 26" aria-hidden="true">
                  {rain.map(({ dateIso, rainMm }, index) => (
                    <rect key={dateIso} x={index * 2} y={26 - (rainMm / maxRain) * 25} width="1.5" height={(rainMm / maxRain) * 25} />
                  ))}
                </svg>
                {comparison && <span>{formatNumber(comparison.totalRainMm)} mm</span>}
              </span>
            )}
          </div>
          <ArrowDownRight className="preview-arrow" size={20} aria-hidden="true" />
        </a>
      </section>
    </div>
  )
}
