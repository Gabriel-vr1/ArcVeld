import { MapPin } from 'lucide-react'
import { useState } from 'react'
import geography from '../assets/kasungu-map.json'
import satellite from '../assets/kasungu-landsat9.webp'
import landsat from '../data/landsatKasungu.json'
import { referenceProvenance } from '../data/researchReference'
import { formatDate } from '../format'

const { queryLat, queryLon } = referenceProvenance

// Match the longitude and latitude scales used to prepare the bundled map.
const x = 340 + (queryLon - 34.4) * 43
const y = 165 + (-13.25 - queryLat) * 38

export function KasunguMap() {
  const [view, setView] = useState<'map' | 'satellite'>('map')

  return (
    <figure className="reference-map">
      <div className="map-heading">
        <span><MapPin size={16} aria-hidden="true" /> Kasungu reference area</span>
        <div className="map-view-switch" role="group" aria-label="Kasungu view">
          <button type="button" aria-pressed={view === 'map'} onClick={() => setView('map')}>Regional Map</button>
          <button type="button" aria-pressed={view === 'satellite'} onClick={() => setView('satellite')}>Satellite View</button>
        </div>
      </div>
      <div className="map-view">
        {view === 'map' ? <RegionalMap /> : <img src={satellite} width={landsat.width} height={landsat.height}
          alt="Natural-colour Landsat view of the Kasungu reference area in Central Malawi, showing fields, wooded areas and drainage lines." />}
      </div>
      {view === 'map' ? <figcaption>
        <div><span>NASA POWER query point</span><strong>{Math.abs(queryLat).toFixed(2)}° S, {queryLon.toFixed(2)}° E</strong></div>
        <div><span>Fixed rainfall example</span><strong>1 Nov 2022 – 15 Jan 2023</strong></div>
        <a href="https://www.naturalearthdata.com/about/terms-of-use/">Natural Earth</a>
      </figcaption> : <figcaption>
        <div><span>{landsat.mission} · {landsat.collection} · {formatDate(landsat.acquiredOn)}</span><strong className="satellite-product">{landsat.productId}</strong></div>
        <a href={landsat.sceneUrl}>USGS / NASA Landsat via Planetary Computer</a>
        <span className="basis-full">Geographic context for Kasungu. The exposure model uses rainfall and illustrative ground cover.</span>
      </figcaption>}
    </figure>
  )
}

function RegionalMap() {
  return (
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
  )
}
