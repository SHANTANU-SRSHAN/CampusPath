import { ArrowRight, Footprints, Waypoints } from 'lucide-react'
import { useMemo } from 'react'
import {
  campusEdges,
  campusNodeById,
  campusNodes,
  categoryById,
} from '../data/campusGraph'
import { useRoute } from '../context/RouteContext'
import { reconstructPath } from '../lib/floydWarshall'
import { formatDistance, formatWalkTimeShort } from '../lib/format'
import { CampusLocationIcon } from './CampusIcon'

const positions: Record<string, { x: number; y: number; label: string }> = {
  'main-gate-1': { x: 82, y: 350, label: 'Main Gate 1' },
  'tpo-cell': { x: 185, y: 365, label: 'TPO Cell' },
  'admission-cell': { x: 220, y: 245, label: 'Admission Cell' },
  'programming-lab': { x: 312, y: 383, label: 'Programming Lab' },
  'library': { x: 355, y: 172, label: 'Library' },
  'cse-department': { x: 405, y: 270, label: 'CSE Department' },
  'ai-ml-lab': { x: 548, y: 322, label: 'AI & ML Lab' },
  'department-cell': { x: 535, y: 218, label: 'Department Cell' },
  'auditorium': { x: 482, y: 93, label: 'Auditorium' },
}

const miniNodeIds = Object.keys(positions)
const sourceId = 'main-gate-1'
const destinationId = 'ai-ml-lab'
const walkSpeed = 1.3

function midpoint(a: { x: number; y: number }, b: { x: number; y: number }) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

function sortedPair(from: string, to: string) {
  return [from, to].sort().join('::')
}

export function HeroCampusGraph() {
  const { allPairs } = useRoute()

  const route = useMemo(
    () => reconstructPath(allPairs, sourceId, destinationId),
    [allPairs],
  )

  const pathEdgeKeys = useMemo(
    () =>
      new Set(
        route.segments.map((segment) => sortedPair(segment.fromId, segment.toId)),
      ),
    [route.segments],
  )

  const miniEdges = useMemo(
    () =>
      campusEdges.filter(
        (edge) =>
          positions[edge.from] &&
          positions[edge.to] &&
          miniNodeIds.includes(edge.from) &&
          miniNodeIds.includes(edge.to),
      ),
    [],
  )

  const pathNames = route.pathIds
    .map((id) => campusNodeById.get(id)?.name)
    .filter(Boolean)

  const destination = campusNodeById.get(destinationId)

  return (
    <div className="hero-map-card" aria-label="Live example of a shortest path on the campus graph">
      <div className="hero-map-topline">
        <span className="live-label">
          <span className="status-dot" aria-hidden="true" />
          Live campus graph
        </span>
        <span className="mono micro-copy">V = {campusNodes.length}</span>
      </div>

      <div className="hero-map-canvas">
        <svg viewBox="0 0 630 425" role="img" aria-labelledby="hero-graph-title">
          <title id="hero-graph-title">
            A preview of the CampusPath graph showing the calculated shortest route from Main
            Gate 1 to the AI and Machine Learning Lab.
          </title>
          <defs>
            <pattern id="heroDots" width="18" height="18" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1" fill="#DDD4C7" opacity="0.55" />
            </pattern>
            <filter id="nodeShadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodOpacity="0.12" />
            </filter>
          </defs>

          <rect width="630" height="425" fill="url(#heroDots)" rx="18" />
          <path
            d="M40 412 C180 380, 180 300, 330 280 C470 262, 540 180, 610 120"
            fill="none"
            stroke="#EAE0D2"
            strokeWidth="22"
            strokeLinecap="round"
            opacity="0.54"
          />
          <path
            d="M58 70 C140 145, 278 90, 350 130 C445 184, 518 144, 582 220"
            fill="none"
            stroke="#EAE0D2"
            strokeWidth="13"
            strokeLinecap="round"
            opacity="0.42"
          />

          <text x="33" y="54" className="map-zone-label">
            CENTRAL CAMPUS
          </text>
          <text x="458" y="393" className="map-zone-label">
            ACADEMIC QUARTER
          </text>
          <path
            d="M30 67H172"
            stroke="#C9BFB0"
            strokeWidth="1"
            strokeDasharray="2 5"
          />

          {miniEdges.map((edge) => {
            const from = positions[edge.from]
            const to = positions[edge.to]
            const isPath = pathEdgeKeys.has(sortedPair(edge.from, edge.to))
            const mid = midpoint(from, to)
            return (
              <g key={`${edge.from}-${edge.to}`}>
                <line
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  className={isPath ? 'hero-edge is-path' : 'hero-edge'}
                />
                {isPath && (
                  <g>
                    <circle cx={mid.x} cy={mid.y} r="4" className="hero-edge-node" />
                    <g transform={`translate(${mid.x - 20} ${mid.y - 17})`}>
                      <rect width="40" height="18" rx="9" className="hero-distance-pill" />
                      <text
                        x="20"
                        y="12.5"
                        textAnchor="middle"
                        className="hero-distance-text"
                      >
                        {edge.distance} m
                      </text>
                    </g>
                  </g>
                )}
              </g>
            )
          })}

          {miniNodeIds.map((id) => {
            const node = campusNodeById.get(id)
            const position = positions[id]
            if (!node || !position) return null
            const isStart = id === sourceId
            const isEnd = id === destinationId
            const onPath = route.pathIds.includes(id)
            const category = categoryById.get(node.category)
            const labelBelow = position.y < 390
            return (
              <g key={id} className="hero-node-group">
                <circle
                  cx={position.x}
                  cy={position.y}
                  r={onPath ? 24 : 20}
                  fill={isStart ? '#26a69a' : isEnd ? '#D9A441' : '#FFFFFF'}
                  stroke={
                    onPath ? (isEnd ? '#B88425' : '#26a69a') : category?.color ?? '#bbb'
                  }
                  strokeWidth={onPath ? 2.5 : 1.3}
                  filter="url(#nodeShadow)"
                />
                <foreignObject
                  x={position.x - 12}
                  y={position.y - 12}
                  width="24"
                  height="24"
                >
                  <span
                    className="hero-node-icon"
                    style={{
                      color: isStart || isEnd ? '#FFFDF7' : category?.color,
                    }}
                  >
                    <CampusLocationIcon icon={node.icon} size={15} strokeWidth={1.8} />
                  </span>
                </foreignObject>
                {onPath && (
                  <circle
                    cx={position.x}
                    cy={position.y}
                    r={onPath ? 29 : 24}
                    fill="none"
                    stroke={isEnd ? '#D9A441' : '#26a69a'}
                    strokeWidth="1"
                    strokeDasharray="2 4"
                    opacity="0.6"
                  />
                )}
                <text
                  x={position.x}
                  y={position.y + (labelBelow ? 43 : -34)}
                  textAnchor="middle"
                  className={`hero-node-label${onPath ? ' is-path' : ''}`}
                >
                  {position.label}
                </text>
                {(isStart || isEnd) && (
                  <text
                    x={position.x}
                    y={position.y + (labelBelow ? 57 : -21)}
                    textAnchor="middle"
                    className={`hero-node-role${isEnd ? ' is-end' : ''}`}
                  >
                    {isStart ? 'START' : 'DESTINATION'}
                  </text>
                )}
              </g>
            )
          })}
        </svg>

        <div className="hero-map-chip hero-map-chip-top">
          <Waypoints size={14} aria-hidden="true" />
          <span>{campusEdges.length} walkable links</span>
        </div>
        <div className="hero-map-chip hero-map-chip-bottom">
          <Footprints size={14} aria-hidden="true" />
          <span>≈ {formatWalkTimeShort(route.distance / walkSpeed)} walk</span>
        </div>
      </div>

      <div className="hero-route-summary">
        <div className="route-summary-badge" aria-hidden="true">
          <span>FW</span>
        </div>
        <div className="hero-route-copy">
          <span className="eyebrow-small">Calculated shortest route</span>
          <p>
            {pathNames.slice(0, -1).map((name) => (
              <span key={name}>
                {name} <ArrowRight size={11} aria-hidden="true" />
              </span>
            ))}
            <span>{pathNames[pathNames.length - 1]}</span>
          </p>
        </div>
        <div className="hero-route-distance">
          <strong>{formatDistance(route.distance)}</strong>
          <span>{route.pathIds.length - 1} segments</span>
        </div>
      </div>
      <span className="sr-only">
        The route ends at {destination?.name ?? 'the selected destination'}.
      </span>
    </div>
  )
}
