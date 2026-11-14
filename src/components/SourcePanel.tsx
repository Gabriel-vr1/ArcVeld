import { ArrowUpRight, BookOpen, FileText } from 'lucide-react'
import { Badge } from './ui/Badge'

const sourceLinks = [
  { href: 'https://power.larc.nasa.gov/docs/services/api/temporal/daily/', text: 'NASA POWER Daily API documentation' },
  { href: 'https://gpm.nasa.gov/data/directory', text: 'NASA GPM precipitation data directory' },
  { href: 'https://www.spaceappschallenge.org/2026/challenges/field-shift-adapting-farms-with-nasa-data/?tab=resources', text: 'Field Shift challenge resources' },
] as const

export function SourcePanel() {
  return (
    <section id="sources" aria-labelledby="sources-title" className="page-width content-section sources-section" tabIndex={-1}>
      <div className="section-heading">
        <p className="eyebrow"><BookOpen size={16} aria-hidden="true" /> Sources &amp; methods</p>
        <h2 id="sources-title">Where the evidence comes from</h2>
      </div>

      <div className="sources-grid">
        <article id="research-example" className="source-card" aria-labelledby="reference-title" tabIndex={-1}>
          <div className="source-card-heading">
            <FileText size={19} aria-hidden="true" />
            <h3 id="reference-title">2022/23 research example</h3>
          </div>
          <p className="card-description">
            The repository’s reference CSV was transcribed from the research report. The original provider
            response is pending independent verification.
          </p>
          <dl className="source-facts">
            <div><dt>Research product</dt><dd>NASA POWER · MERRA-2 reanalysis</dd></div>
            <div><dt>Variable</dt><dd>PRECTOTCORR · corrected precipitation</dd></div>
            <div><dt>Reference dates</dt><dd>1 Nov 2022–15 Jan 2023 · UTC</dd></div>
            <div><dt>Query point</dt><dd>13.05° S, 33.45° E · Kasungu reference</dd></div>
          </dl>
          <details className="research-details">
            <summary>Illustrative return dates</summary>
            <p>Scenario C uses the same nominal extra cover for a return on 15 November 2022 or 6 December 2022. Both dates require local feasibility checks.</p>
          </details>
        </article>
        <article className="source-card">
          <h3>Evidence and eligibility</h3>
          <div className="source-note">
            <Badge tone="green">Cover inputs: illustrative</Badge>
            <p>Cover assumptions and return timings require local observations and feasibility checks before they can inform field advice.</p>
          </div>
          <div className="source-note">
            <Badge tone="ochre">NASA source: unconfirmed</Badge>
            <p>Confirmation that a data source is on the official Field Shift resource list is pending. GPM IMERG acquisition is also pending.</p>
          </div>
          <ul className="source-links">
            {sourceLinks.map(({ href, text }) => (
              <li key={href}><a className="text-link" href={href}>{text} <ArrowUpRight size={15} aria-hidden="true" /></a></li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  )
}
