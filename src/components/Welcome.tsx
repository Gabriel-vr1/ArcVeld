import { ArrowRight } from 'lucide-react'
import geography from '../assets/kasungu-map.json'
import { referenceProvenance } from '../data/researchReference'
import { routes } from '../navigation'

const { queryLat, queryLon } = referenceProvenance
const coordinates = `${Math.abs(queryLat).toFixed(2)}° S, ${queryLon.toFixed(2)}° E`

// Same longitude and latitude scales as the regional map, then a shared oblique transform.
const x = 340 + (queryLon - 34.4) * 43
const y = 165 + (-13.25 - queryLat) * 38
const projection = 'matrix(1.48 -.2 .43 .98 -263 103)'
const markerX = 1.48 * x + .43 * y - 263
const markerY = -.2 * x + .98 * y + 103
const surface = 'M237 3H430L447 326H230Z'

function MalawiRelief() {
  return (
    <figure className="welcome-atlas">
      <svg viewBox="0 0 570 432" role="img" aria-labelledby="relief-title relief-description">
        <title id="relief-title">Illustrative relief of Malawi and the Kasungu reference point</title>
        <desc id="relief-description">An oblique view of the Natural Earth outline and Lake Malawi. Kasungu is marked at {coordinates}. The stacked outline and contour lines are illustrative.</desc>
        <defs>
          <path id="relief-country" d={geography.countries.MWI} fillRule="evenodd" />
          <clipPath id="relief-country-clip"><use href="#relief-country" /></clipPath>
          <clipPath id="relief-plane-clip"><path d={surface} /></clipPath>
          <pattern id="relief-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M20 0H0V20" className="relief-grid" />
          </pattern>
          <linearGradient id="relief-face" x1="0" y1="0" x2=".9" y2="1" gradientUnits="objectBoundingBox">
            <stop stopColor="var(--violet)" />
            <stop offset="1" stopColor="var(--violet)" />
          </linearGradient>
        </defs>
        <path d={surface} transform={`translate(0 28) ${projection}`} className="relief-plane-shadow" />
        <g transform={projection}>
          <path d={surface} className="relief-plane" />
          <g clipPath="url(#relief-plane-clip)">
            <path d={surface} fill="url(#relief-grid)" />
            {(['ZMB', 'TZA', 'MOZ'] as const).map((country) => (
              <path key={country} d={geography.countries[country]} className="relief-neighbour" />
            ))}
          </g>
        </g>
        {[24, 18, 12, 6].map((depth) => (
          <use key={depth} href="#relief-country" transform={`translate(0 ${depth}) ${projection}`} className="relief-layer" />
        ))}
        <g transform={projection}>
          <use href="#relief-country" className="relief-face" />
          <g clipPath="url(#relief-country-clip)" className="relief-contours">
            {/* These curves are graphic texture, independent of terrain or satellite measurements. */}
            {Array.from({ length: 31 }, (_, index) => {
              const row = index * 10
              return <path key={row} d={`M246 ${row} C290 ${row - 42}, 301 ${row + 22}, 343 ${row - 4} S385 ${row - 25}, 426 ${row + 10}`} />
            })}
          </g>
          <g clipPath="url(#relief-plane-clip)" className="relief-lakes">
            {geography.lakes.map((lake) => <path key={lake} d={lake} />)}
          </g>
        </g>
        <text x="437" y="149" className="relief-lake-label">Lake Malawi</text>
        <path d="M430 145h-87l-30-11" className="relief-lake-leader" />
        <text x="345" y="380" className="relief-country-label">Malawi</text>
        <g className="relief-pin">
          <path d={`M26 ${markerY + 25} H${markerX - 32} L${markerX} ${markerY}`} />
          <circle cx={markerX} cy={markerY} r="11" />
          <circle cx={markerX} cy={markerY} r="3.8" className="relief-pin-dot" />
        </g>
        <text x="26" y={markerY + 15} className="relief-location">Kasungu</text>
        <text x="26" y={markerY + 46} className="relief-coordinates">{coordinates}</text>
      </svg>
      <figcaption>Illustrative relief · Natural Earth boundaries</figcaption>
    </figure>
  )
}

export function Welcome() {
  return (
    <div className="welcome">
      <div className="welcome-frame">
        <header className="welcome-top">
          <span>NASA Space Apps Challenge <strong>2026</strong></span>
          <span>Field Shift</span>
        </header>
        <div className="welcome-stage">
          <div className="welcome-copy">
            <p className="welcome-location">Kasungu, Malawi</p>
            <h1>ArcVeld</h1>
            <p>Investigate crop-residue timing against historical rainfall.</p>
            <a className="welcome-enter" href={routes.overview.href}>Enter ArcVeld <ArrowRight size={20} aria-hidden="true" /></a>
          </div>
          <MalawiRelief />
        </div>
        <footer className="welcome-footer">
          <span>Kasungu rainfall reference <span aria-hidden="true">/</span> <strong>{coordinates}</strong></span>
          <a href="https://www.naturalearthdata.com/about/terms-of-use/">Natural Earth attribution</a>
        </footer>
      </div>
    </div>
  )
}
