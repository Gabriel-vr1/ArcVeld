import { MapPin } from 'lucide-react'
import geography from '../assets/kasungu-map.json'
import { referenceProvenance } from '../data/researchReference'

const { queryLat, queryLon } = referenceProvenance

// Match the longitude and latitude scales used to prepare the bundled map.
const x = 340 + (queryLon - 34.4) * 43
const y = 165 + (-13.25 - queryLat) * 38

export function KasunguMap() {
  return (
    <figure className="reference-map">
      <div className="map-heading">
        <span><MapPin size={16} aria-hidden="true" /> Kasungu reference area</span>
        <span>Central Malawi</span>
      </div>
      <svg viewBox="0 0 660 330" role="img" aria-labelledby="map-title map-description">
        <title id="map-title">Malawi and the Kasungu rainfall reference point</title>
        <desc id="map-description">Map of Malawi and its neighbours, with Lake Malawi and the NASA POWER query at 13.05 degrees south, 33.45 degrees east.</desc>
        <defs>
          <pattern id="map-grid" x="13.2" y="3.5" width="43" height="38" patternUnits="userSpaceOnUse">
            <path d="M 43 0 H 0 V 38" fill="none" className="regional-gridline" />
          </pattern>
        </defs>
        <rect width="660" height="330" className="regional-water" />
        {Object.entries(geography.countries).map(([country, path]) => (
          <path key={country} d={path} className={country === 'MWI' ? 'regional-country regional-malawi' : 'regional-country'}
            fillRule="evenodd" />
        ))}
        {geography.lakes.map((path) => <path key={path} d={path} className="regional-lake" />)}
        <rect width="660" height="330" fill="url(#map-grid)" />
        <g className="map-labels" aria-hidden="true">
          <text x="125" y="119">ZAMBIA</text>
          <text x="398" y="39">TANZANIA</text>
          <text x="426" y="235">MOZAMBIQUE</text>
          <text className="map-country" x="332" y="230">MALAWI</text>
          <text className="map-water" x="381" y="117">Lake</text>
          <text className="map-water" x="381" y="134">Malawi</text>
        </g>
        <g aria-hidden="true">
          <path d={`M ${x} ${y} l -32 30 h -65`} className="regional-leader" />
          <circle cx={x} cy={y} r="13" className="regional-ring" />
          <circle cx={x} cy={y} r="5.5" className="regional-dot" />
          <rect x={x - 175} y={y + 16} width="94" height="30" rx="3" fill="#142e29" />
          <text x={x - 128} y={y + 35.5} textAnchor="middle" className="map-point">Kasungu</text>
          <path d="M 620 58 V 36 m -6 7 l 6 -7 l 6 7" className="regional-leader" />
          <text x="620" y="30" textAnchor="middle" className="map-north">N</text>
        </g>
      </svg>
      <figcaption>
        <div><span>NASA POWER query point</span><strong>{Math.abs(queryLat).toFixed(2)}° S, {queryLon.toFixed(2)}° E</strong></div>
        <div><span>Observation period</span><strong>1 Nov 2022 – 15 Jan 2023</strong></div>
        <a href="https://www.naturalearthdata.com/about/terms-of-use/">Natural Earth</a>
      </figcaption>
    </figure>
  )
}
