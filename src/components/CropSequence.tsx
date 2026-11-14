import { ArrowRight, CalendarDays, Leaf, Sprout, Wheat } from 'lucide-react'
import { Badge } from './ui/Badge'

const scenarios = [
  {
    id: 'A',
    title: 'Current practice',
    firstCrop: 'Maize',
    description: 'Maize stays in both seasons. Residue handling follows the farmer’s current practice.',
    icon: Wheat,
    tone: 'ochre',
  },
  {
    id: 'B',
    title: 'Ordinary rotation',
    firstCrop: 'Groundnut',
    description: 'Groundnut takes the first-season maize area. Residue use follows ordinary practice.',
    icon: Leaf,
    tone: 'green',
  },
  {
    id: 'C',
    title: 'Managed rotation',
    firstCrop: 'Groundnut',
    description: 'Compare two timings for returning the same stock of protected groundnut residue.',
    icon: Sprout,
    tone: 'rain',
  },
] as const

export function CropSequence() {
  return (
    <section id="scenarios" aria-labelledby="scenarios-title" className="page-width content-section" tabIndex={-1}>
      <div className="section-heading">
        <p className="eyebrow"><Sprout size={16} aria-hidden="true" /> Agricultural scenarios</p>
        <h2 id="scenarios-title">Two crop sequences, three management options</h2>
      </div>
      <div className="scenario-grid">
        {scenarios.map(({ id, title, firstCrop, description, icon: Icon, tone }) => (
          <article key={id} className="scenario-card">
            <div className="scenario-top">
              <span className={`scenario-icon scenario-icon-${tone}`}><Icon size={21} aria-hidden="true" /></span>
              <Badge>Scenario {id}</Badge>
            </div>
            <h3>{title}</h3>
            <p className="crop-path">
              {firstCrop} <ArrowRight size={15} aria-label="followed by" role="img" /> Maize
            </p>
            <p className="card-description">{description}</p>
            {id === 'C' && (
              <ul className="timing-options" aria-label="Illustrative return timings">
                <li><CalendarDays size={14} aria-hidden="true" /> Earlier return</li>
                <li><CalendarDays size={14} aria-hidden="true" /> Later return</li>
              </ul>
            )}
          </article>
        ))}
      </div>
      <p className="section-note">
        Both return timings are illustrative. Check usable residue after household and livestock needs,
        grazing control, and workable dates with a local adviser.
      </p>
    </section>
  )
}
