import { ArrowUpRight } from 'lucide-react'
import { referenceProvenance } from '../data/researchReference'
import { routes } from '../navigation'

const sections = [
  { id: 'datasets', label: 'NASA data & provenance' },
  { id: 'agriculture', label: 'Agricultural research' },
  { id: 'method', label: 'Scientific method' },
  { id: 'limitations', label: 'Assumptions & limits' },
  { id: 'eligibility', label: 'Competition eligibility' },
  { id: 'references', label: 'References & credits' },
]

const repo = 'https://github.com/Gabriel-vr1/ArcVeld/blob/main/'

function SourceLink({ href, children }: { href: string; children: string }) {
  return <a className="text-link" href={href}>{children}<ArrowUpRight size={15} aria-hidden="true" /></a>
}

export function SourcePanel() {
  return (
    <div className="page-width page-body">
      <header className="page-heading">
        <div>
          <h1>Research &amp; Methodology</h1>
          <p>Data sources, scenario assumptions, and how to interpret the comparison.</p>
        </div>
      </header>
      <div className="research-layout">
        <nav aria-label="On this page" className="research-index">
          <h2>On this page</h2>
          {sections.map(({ id, label }) => (
            <a key={id} href={`#${id}`} onClick={(event) => {
              event.preventDefault()
              const section = document.getElementById(id)
              section?.focus({ preventScroll: true })
              section?.scrollIntoView({ block: 'start' })
            }}>{label}</a>
          ))}
        </nav>

        <div className="research-content">
          <section id="datasets" tabIndex={-1}>
            <h2>NASA data &amp; provenance</h2>
            <p>The bundled rainfall series was transcribed from the ArcVeld research report. Independent verification of the original provider response is pending.</p>
            <dl className="source-facts">
              <div><dt>Research product</dt><dd>NASA POWER · MERRA-2 reanalysis</dd></div>
              <div><dt>Variable</dt><dd>PRECTOTCORR · corrected daily precipitation (mm)</dd></div>
              <div><dt>Reference window</dt><dd>1 Nov 2022 – 15 Jan 2023 · {referenceProvenance.dayCount} UTC days</dd></div>
              <div><dt>Query point</dt><dd>13.05° S, 33.45° E · Kasungu reference</dd></div>
            </dl>
            <details className="research-details">
              <summary>Technical provenance</summary>
              <p>{referenceProvenance.sourceSection}</p>
              <p>Research report: <code>{referenceProvenance.sourceDocument}</code></p>
              <p>Reported original response SHA-256: <code>{referenceProvenance.reportedOriginalRawSHA256}</code></p>
              <ul className="source-links">
                <li><SourceLink href={referenceProvenance.queryUrl}>Research query URL</SourceLink></li>
                <li><SourceLink href={repo + 'Arcveld_Malawi_2022_Research_Rainfall_Reference.csv'}>Reference rainfall CSV</SourceLink></li>
                <li><SourceLink href={repo + 'Arcveld_Malawi_2022_Rainfall_Reference_Provenance.json'}>Provenance JSON</SourceLink></li>
              </ul>
            </details>
          </section>

          <section id="agriculture" tabIndex={-1}>
            <h2>Agricultural research</h2>
            <p>Malawi field studies document maize–legume rotations and varied residue management, including removal, retention, and losses to grazing. ArcVeld uses that context to frame the scenarios.</p>
            <ul className="source-links">
              <li><SourceLink href="https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0298009">Malawi conservation agriculture study · PLOS ONE</SourceLink></li>
              <li><SourceLink href="https://www.sciencedirect.com/science/article/abs/pii/S0378429024003186">Maize–legume rotation study · Field Crops Research</SourceLink></li>
            </ul>
          </section>

          <section id="method" tabIndex={-1}>
            <h2>Scientific method</h2>
            <dl className="method-steps">
              <div><dt>Calendar</dt><dd>Sum the uncovered fraction on each day, in uncovered area-days.</dd></div>
              <div><dt>Uniform rainfall</dt><dd>Spread the season’s rainfall evenly across the days and weight it by estimated uncovered ground.</dd></div>
              <div><dt>Historical daily rainfall</dt><dd>Multiply each day’s rainfall by its estimated uncovered fraction, then sum the products in mm-equivalent.</dd></div>
            </dl>
            <details className="research-details">
              <summary>Illustrative return dates and cover model</summary>
              <p>The research example uses 15 November 2022 and 6 December 2022. Both schedules start from 15% baseline cover and add 25 percentage points on return. The added cover holds through day 14 and falls linearly to zero by day 28.</p>
              <p>Each date’s contribution to the later-minus-earlier difference is its rainfall multiplied by earlier cover minus later cover, with cover expressed as fractions.</p>
            </details>
          </section>

          <section id="limitations" tabIndex={-1}>
            <h2>Assumptions &amp; limits</h2>
            <ul className="research-list">
              <li>NASA POWER / MERRA-2 supplies regional reanalysis precipitation. Ground cover and residue persistence are illustrative.</li>
              <li>Historical exposure is a comparison proxy. It does not measure erosion, runoff, yield or future risk.</li>
              <li>Local observations and an extension adviser can help verify residue availability, grazing control, timing and cover before a field decision.</li>
              <li>The blueprint reports an opposite result in 2021/22 under its reference assumptions. The underlying daily series for that season is outside the bundled evidence.</li>
            </ul>
          </section>

          <section id="eligibility" tabIndex={-1}>
            <h2>Competition-resource eligibility</h2>
            <p><strong>NASA source: unconfirmed.</strong> Confirmation that the source appears on the official Field Shift resources list is pending. GPM IMERG is a separate product and does not supply this comparison.</p>
            <SourceLink href="https://www.spaceappschallenge.org/2026/challenges/field-shift-adapting-farms-with-nasa-data/?tab=resources">Field Shift challenge resources</SourceLink>
          </section>

          <section id="references" tabIndex={-1}>
            <h2>References &amp; acknowledgements</h2>
            <ul className="source-links">
              <li><SourceLink href="https://power.larc.nasa.gov/docs/services/api/temporal/daily/">NASA POWER Daily API documentation</SourceLink></li>
              <li><SourceLink href="https://power.larc.nasa.gov/docs/methodology/data/sources_meteorology/">NASA POWER meteorological data sources</SourceLink></li>
              <li><SourceLink href="https://gpm.nasa.gov/data/directory">NASA GPM precipitation data directory</SourceLink></li>
              <li><SourceLink href="https://www.naturalearthdata.com/about/terms-of-use/">Natural Earth public-domain basemap</SourceLink></li>
              <li><SourceLink href={repo + 'Arcveld_Malawi_Final_MVP_Product_and_Engineering_Blueprint.md'}>ArcVeld engineering blueprint</SourceLink></li>
              <li><SourceLink href={repo + 'THIRD_PARTY_NOTICES.md'}>Third-party notices</SourceLink></li>
            </ul>
          </section>
          <a className="text-link" href={routes.observations.href}>Back to Earth Observations</a>
        </div>
      </div>
    </div>
  )
}
