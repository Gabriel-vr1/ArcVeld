import { ArrowDown, BookOpen, CalendarDays, MapPin } from 'lucide-react'
import landscape from '../assets/central-malawi-illustration.jpg'
import { Badge } from './ui/Badge'
import { ButtonLink } from './ui/Button'

export function Overview() {
  return (
    <section aria-labelledby="overview-title" className="overview page-width">
      <div className="hero">
        <div className="hero-copy">
          <p className="eyebrow"><MapPin size={15} aria-hidden="true" /> Kasungu, Central Malawi</p>
          <h1 id="overview-title">Soil-cover<br /><em>continuity</em></h1>
          <p className="hero-description">
            Compare crop sequences and explore how residue return timing could change
            when soil is left uncovered during Malawi’s early rains.
          </p>
          <div className="hero-actions">
            <ButtonLink href="#scenarios">Explore scenarios <ArrowDown size={17} aria-hidden="true" /></ButtonLink>
            <ButtonLink variant="secondary" href="#research-example">
              <BookOpen size={17} aria-hidden="true" /> View research example
            </ButtonLink>
          </div>
        </div>

        <figure className="hero-figure">
          <img
            src={landscape}
            alt="Illustrated maize rows and small rainfed plots in a rolling Central Malawi landscape"
            width={1536}
            height={1024}
            fetchPriority="high"
          />
          <figcaption>AI-generated landscape illustration</figcaption>
        </figure>
      </div>

      <div className="evidence-strip" aria-label="Reference case and evidence status">
        <p className="reference-window"><CalendarDays size={17} aria-hidden="true" />
          <span>Reference window <strong>1 Nov–15 Jan · UTC</strong></span>
        </p>
        <ul className="evidence-badges">
          <li><Badge tone="rain">Research reference: NASA POWER / MERRA-2</Badge></li>
          <li><Badge tone="ochre">NASA source: unconfirmed</Badge></li>
          <li><Badge tone="green">Cover inputs: illustrative</Badge></li>
        </ul>
      </div>
    </section>
  )
}
