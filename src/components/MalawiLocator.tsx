import { useId } from 'react'
import geography from '../assets/kasungu-map.json'
import { referenceProvenance } from '../data/researchReference'

const { queryLat, queryLon } = referenceProvenance

// The bundled Natural Earth map uses these longitude and latitude scales.
const referenceMapPoint = {
  x: 340 + (queryLon - 34.4) * 43,
  y: 165 + (-13.25 - queryLat) * 38,
}

export function MalawiLocator({ relief = false }: { relief?: boolean }) {
  const outline = useId()
  const { x, y } = referenceMapPoint

  return (
    <svg className={relief ? 'malawi-locator malawi-relief' : 'malawi-locator'} viewBox="255 10 172 315" aria-hidden="true">
      <defs>
        <path id={outline} d={geography.countries.MWI} fillRule="evenodd" />
      </defs>
      {relief && [20, 12, 5].map(offset => (
        <use key={offset} href={`#${outline}`} className="locator-layer" transform={`translate(${offset * 0.55} ${offset * 0.6})`} />
      ))}
      <use href={`#${outline}`} className="locator-land" />
      {relief && (
        <g className="locator-contours">
          {/* Decorative contour lines. They do not represent measured elevation. */}
          {Array.from({ length: 17 }, (_, index) => (
            <ellipse key={index} cx={x + 28} cy={y - 22} rx={12 + index * 7} ry={15 + index * 9}
              transform={`rotate(-22 ${x + 28} ${y - 22})`} />
          ))}
        </g>
      )}
      <circle className="locator-ring" cx={x} cy={y} r={relief ? 12 : 15} />
      <circle className="locator-point" cx={x} cy={y} r={relief ? 4 : 7} />
    </svg>
  )
}
