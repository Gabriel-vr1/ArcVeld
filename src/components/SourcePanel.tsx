import { ArrowUpRight } from 'lucide-react'
import { referenceProvenance } from '../data/researchReference'
import { historicalRainfall, seasonLabel } from '../data/historicalRainfall'
import { imergLabel, imergRainfall } from '../data/imergRainfall'
import challengeResources from '../data/challengeResources.json'
import landsat from '../data/landsatKasungu.json'
import { formatDate } from '../format'
import { routes } from '../navigation'

const sections = [
  { id: 'background', label: 'Research background' },
  { id: 'datasets', label: 'NASA data & provenance' },
  { id: 'agriculture', label: 'Agricultural research' },
  { id: 'method', label: 'Scientific method' },
  { id: 'assumptions', label: 'Cover assumptions' },
  { id: 'limitations', label: 'Scientific limitations' },
  { id: 'eligibility', label: 'Competition eligibility' },
  { id: 'references', label: 'References & credits' },
]

const repo = 'https://github.com/Gabriel-vr1/ArcVeld/blob/main/'

function SourceLink({ href, children }: { href: string; children: string }) {
  return <a className="text-link" href={href}>{children}<ArrowUpRight size={15} aria-hidden="true" /></a>
}

export function SourcePanel() {
  const provenance = historicalRainfall.provenance
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
          <section id="background" tabIndex={-1}>
            <h2>Research background</h2>
            <p>The Kasungu case compares earlier and later returns of protected groundnut residue before maize. Each comparison uses the same historical rainfall record and illustrative cover assumptions for both schedules.</p>
          </section>
          <section id="datasets" tabIndex={-1}>
            <h2>NASA data &amp; provenance</h2>
            {provenance ? (
              <p>ArcVeld independently retrieved and validated {provenance.validation.publishedRecordCount} daily values across {provenance.seasons.length} seasons. The frozen 2022/23 research CSV is retained separately for comparison.</p>
            ) : historicalRainfall.seasons.length > 0 ? (
              <p>The provider bundle failed validation. The app is using the separately identified research-transcribed 2022/23 reference. {historicalRainfall.error}</p>
            ) : (
              <p>Rainfall evidence is unavailable. {historicalRainfall.error}</p>
            )}
            <dl className="source-facts">
              <div><dt>Research product</dt><dd>NASA POWER · MERRA-2 reanalysis</dd></div>
              <div><dt>Variable</dt><dd>PRECTOTCORR · corrected daily precipitation (mm)</dd></div>
              <div><dt>Historical seasons</dt><dd>{historicalRainfall.seasons.map(({ startYear }) => seasonLabel(startYear)).join(', ') || 'Unavailable'} · {referenceProvenance.dayCount} UTC days per season</dd></div>
              <div><dt>Query point</dt><dd>13.05° S, 33.45° E · Kasungu reference</dd></div>
            </dl>
            <details className="research-details">
              <summary>Technical provenance</summary>
              {provenance && (
                <>
                  <p>POWER Daily API {provenance.product.apiVersion}. NASA reports {provenance.product.providerUnits} for each full UTC day, represented as mm per observation in ArcVeld.</p>
                  <p>Provider acquisition: HTTP {provenance.acquisition.httpStatus} at <time dateTime={provenance.acquisition.retrievedAtUtc}>{provenance.acquisition.retrievedAtUtc}</time>.</p>
                  <p>Retrieved response SHA-256: <code>{provenance.acquisition.rawSha256}</code></p>
                  <p>{provenance.researchComparison2022.exactMatches} of {provenance.researchComparison2022.comparedDays} daily values match the frozen CSV exactly. A separate NASA request returned {provenance.spotCheck.rainMm} mm on {provenance.spotCheck.dateIso}.</p>
                  <p><SourceLink href={repo + 'src/data/rainfall-provenance.json'}>Provider validation manifest</SourceLink></p>
                </>
              )}
              <p>{referenceProvenance.sourceSection}</p>
              <p>Research report: <code>{referenceProvenance.sourceDocument}</code></p>
              <p>Reported original response SHA-256: <code>{referenceProvenance.reportedOriginalRawSHA256}</code></p>
              <ul className="source-links">
                <li><SourceLink href={referenceProvenance.queryUrl}>Research query URL</SourceLink></li>
                <li><SourceLink href={repo + 'Arcveld_Malawi_2022_Research_Rainfall_Reference.csv'}>Reference rainfall CSV</SourceLink></li>
                <li><SourceLink href={repo + 'Arcveld_Malawi_2022_Rainfall_Reference_Provenance.json'}>Provenance JSON</SourceLink></li>
              </ul>
            </details>
            <details className="research-details">
              <summary>{imergLabel}</summary>
              {imergRainfall.metadata ? (
                <>
                  <p>NASA GES DISC collection {imergRainfall.metadata.collection}, processing revision {imergRainfall.metadata.version}. ArcVeld verified {imergRainfall.metadata.days.length} consecutive UTC days in 2022/23 at the 0.1° grid cell centred on 13.05° S, 33.45° E.</p>
                  <p>NASA reports the combined, gauge-adjusted <code>precipitation</code> as a daily mean rate in mm/day, already calculated from the valid half-hourly rates. Over one UTC day, the rate has the same numerical value as the rainfall amount in mm. <code>precipitation_cnt</code> records the number of valid half-hourly retrievals used in that calculation. All 76 days had 48, and ArcVeld uses the published daily amount directly.</p>
                  <p>The source files reproduced 616.35 mm from POWER and 284.40 mm from IMERG over the same 76 UTC dates. On 27 December 2022, the POWER response gave 83.34 mm and the original IMERG granule gave 0.145 mm at the Kasungu cell.</p>
                  <p>POWER uses corrected MERRA-2 reanalysis on a coarser grid. IMERG uses a 0.1° cell and combines satellite retrievals with gauge adjustment. These differences in spatial coverage and estimation can affect daily totals. The comparison cannot establish what caused the 27 December discrepancy or how much rain fell on a particular farm. That would require local rain-gauge observations.</p>
                  <SourceLink href="https://doi.org/10.5067/GPM/IMERGDF/DAY/07">NASA IMERG product</SourceLink>
                  <SourceLink href={repo + 'data/README.md#source-file-sanity-check'}>Source-file sanity check</SourceLink>
                </>
              ) : <p>The bundled IMERG series is unavailable. {imergRainfall.error}</p>}
            </details>
            <details className="research-details">
              <summary>Landsat geographic context</summary>
              <p>{landsat.mission} · {landsat.collection} · {landsat.processingLevel} · {formatDate(landsat.acquiredOn)}.</p>
              <p>Product <code>{landsat.productId}</code>. {landsat.bands}. Display bounds: {landsat.cropExtentLabel}.</p>
              <p>Imagery from {landsat.provider} via the {landsat.distribution}. {landsat.license}. The image provides geographic context independently of the selected rainfall season and illustrative cover.</p>
              <SourceLink href={landsat.sceneUrl}>Landsat scene metadata</SourceLink>
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
              <div><dt>Calendar</dt><dd><span className="method-equation">D = Σ (1 − cᵢ)</span>Sum the daily uncovered fractions in uncovered area-days.</dd></div>
              <div><dt>Uniform rainfall</dt><dd><span className="method-equation">E = (Σ Pᵢ / n) × D</span>Use mean daily rainfall over the analysis window.</dd></div>
              <div><dt>Historical daily rainfall</dt><dd><span className="method-equation">E = Σ Pᵢ (1 − cᵢ)</span>Weight each day’s rainfall by its estimated uncovered fraction.</dd></div>
            </dl>
            <p><var>Pᵢ</var> is daily rainfall in mm, <var>cᵢ</var> is estimated cover as a fraction, and <var>n</var> is the number of days. Both rainfall-weighted results are in mm-equivalent.</p>
            <p>Each date’s contribution to the later-minus-earlier difference is its rainfall multiplied by earlier cover minus later cover, with cover expressed as fractions.</p>
          </section>

          <section id="assumptions" tabIndex={-1}>
            <h2>Cover assumptions</h2>
            <p>Ground cover and residue persistence are illustrative. Both schedules assume the same nominal stock of protected residue.</p>
            <details className="research-details">
              <summary>Illustrative return dates and cover model</summary>
              <p>The research example uses 15 November 2022 and 6 December 2022. Both schedules start from 15% baseline cover and add 25 percentage points on return. The added cover holds through day 14 and falls linearly to zero by day 28.</p>
            </details>
          </section>

          <section id="limitations" tabIndex={-1}>
            <h2>Scientific limitations</h2>
            <ul className="research-list">
              <li>NASA POWER / MERRA-2 supplies regional reanalysis precipitation for the Kasungu reference query.</li>
              <li>Historical exposure is a comparison proxy. It does not measure erosion, runoff, yield or future risk.</li>
              <li>Local observations and an extension adviser can help verify residue availability, grazing control, timing and cover before a field decision.</li>
              {provenance && <li>Use the 2021/22 season and reset the research scenario to inspect how the historical exposure comparison can reverse under the same cover assumptions.</li>}
            </ul>
          </section>

          <section id="eligibility" tabIndex={-1}>
            <h2>Competition-resource eligibility</h2>
            <p><strong>NASA POWER is listed.</strong> The project team reviewed the official Resources page on <time dateTime={challengeResources.verifiedOn}>{formatDate(challengeResources.verifiedOn)}</time> and confirmed these entries:</p>
            <ul className="research-list">
              {challengeResources.titles.map((title) => <li key={title}>{title}</li>)}
            </ul>
            <p>Resource listing, rainfall-data verification and validation of field recommendations are separate.</p>
            <SourceLink href={challengeResources.url}>Official Field Shift Resources</SourceLink>
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
