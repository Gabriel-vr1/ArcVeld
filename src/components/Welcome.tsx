import { ArrowRight } from 'lucide-react'
import geography from '../assets/africa-map.json'
import { referenceProvenance } from '../data/researchReference'
import { routes } from '../navigation'

const { queryLat, queryLon } = referenceProvenance
const x = (queryLon + 23) * 9
const y = (42 - queryLat) * 9

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
            <h1>ArcVeld</h1>
            <p>Earth Observation for Agricultural Planning</p>
            <a className="welcome-enter" href={routes.overview.href}>Enter ArcVeld <ArrowRight size={20} aria-hidden="true" /></a>
          </div>
          <figure className="welcome-atlas">
            <svg viewBox="0 0 735 740" role="img" aria-labelledby="atlas-title atlas-description">
              <title id="atlas-title">Africa with Malawi highlighted</title>
              <desc id="atlas-description">Natural Earth country boundaries showing Malawi and the Kasungu NASA POWER reference query point.</desc>
              <defs>
                <pattern id="atlas-grid" x="27" y="18" width="90" height="90" patternUnits="userSpaceOnUse">
                  <path d="M 90 0 H 0 V 90" fill="none" className="atlas-gridline" />
                </pattern>
                <clipPath id="atlas-extent"><rect width="735" height="740" /></clipPath>
              </defs>
              <g clipPath="url(#atlas-extent)">
                {Object.entries(geography).map(([country, outline]) => (
                  <path key={country} d={outline} fillRule="evenodd"
                    className={country === 'MWI' ? 'atlas-country atlas-malawi' : 'atlas-country'} />
                ))}
                <rect width="735" height="740" fill="url(#atlas-grid)" />
                <text x="269" y="341" className="atlas-label">AFRICA</text>
                <g className="atlas-marker">
                  <circle cx={x} cy={y} r="32" className="atlas-ring-outer" />
                  <circle cx={x} cy={y} r="15" className="atlas-ring" />
                  <circle cx={x} cy={y} r="4" className="atlas-dot" />
                  <path d={`M ${x + 14} ${y - 7} l 37 -33 h 140`} />
                  <text x={x + 62} y={y - 51} className="atlas-location">MALAWI</text>
                  <text x={x + 62} y={y - 18} className="atlas-coordinates">KASUNGU REFERENCE</text>
                </g>
              </g>
            </svg>
          </figure>
        </div>
        <footer className="welcome-footer">
          <span>Kasungu, Malawi <span aria-hidden="true">/</span> <strong>{Math.abs(queryLat).toFixed(2)}° S, {queryLon.toFixed(2)}° E</strong></span>
          <a href="https://www.naturalearthdata.com/about/terms-of-use/">Made with Natural Earth</a>
        </footer>
      </div>
    </div>
  )
}
