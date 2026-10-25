import {
  ArrowRight,
  CircleAlert,
  CircleCheck,
  Clock,
  Footprints,
  Gauge,
  MapPinned,
  RotateCcw,
  Route,
  Table2,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useRoute } from '../context/RouteContext'
import {
  campusEdges,
  campusNodes,
  categoryById,
  type CampusNode,
} from '../data/campusGraph'
import { formatDistance, formatWalkTime } from '../lib/format'
import { CategoryIcon, CampusLocationIcon } from './CampusIcon'
import { PathSimulationChart } from './PathSimulationChart'
import { RoutePreview } from './RoutePreview'

interface ShortestPathResultsProps {
  walkingSpeed: number
}

function LocationBadge({
  node,
  role,
}: {
  node: CampusNode
  role: 'start' | 'end'
}) {
  const category = categoryById.get(node.category)
  return (
    <div className={`result-location result-location-${role}`}>
      <span className={`result-location-marker ${role}`} aria-hidden="true" />
      <span
        className="result-location-icon"
        style={{ color: category?.color, backgroundColor: category?.tint }}
      >
        <CampusLocationIcon icon={node.icon} size={18} />
      </span>
      <span className="result-location-copy">
        <span>{role === 'start' ? 'Starting location' : 'Destination'}</span>
        <strong>{node.name}</strong>
      </span>
    </div>
  )
}

export function ShortestPathResults({ walkingSpeed }: ShortestPathResultsProps) {
  const { result, clearResult } = useRoute()

  if (!result) {
    return (
      <section className="results-card results-empty" aria-labelledby="results-empty-title">
        <div className="empty-route-illustration" aria-hidden="true">
          <svg viewBox="0 0 240 142">
            <path
              d="M29 112C69 112 68 41 115 41s36 64 95 64"
              fill="none"
              stroke="#DDD4C7"
              strokeWidth="2"
              strokeDasharray="5 7"
            />
            <circle cx="29" cy="112" r="13" fill="#26a69a" />
            <circle cx="210" cy="105" r="13" fill="#D9A441" />
            <circle cx="115" cy="41" r="9" fill="#FFF" stroke="#B8AE9F" strokeWidth="2" />
            <circle cx="168" cy="78" r="7" fill="#FFF" stroke="#B8AE9F" strokeWidth="2" />
            <path
              d="M42 112C70 112 71 52 101 45"
              fill="none"
              stroke="#26a69a"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <text x="20" y="137" className="empty-map-label">
              START
            </text>
            <text x="177" y="133" className="empty-map-label">
              DESTINATION
            </text>
            <circle cx="98" cy="35" r="3" fill="#D9A441" />
            <circle cx="179" cy="87" r="3" fill="#D9A441" />
          </svg>
        </div>
        <span className="eyebrow">Floyd–Warshall is ready</span>
        <h2 id="results-empty-title">Your shortest route will appear here.</h2>
        <p>
          Choose a starting location and a destination in the planner. Every pair of
          locations is already covered by the all-pairs distance matrix.
        </p>
        <div className="empty-result-facts">
          <span>
            <Table2 size={15} aria-hidden="true" />
            {campusNodes.length} × {campusNodes.length} matrix
          </span>
          <span>
            <Route size={15} aria-hidden="true" />
            {campusEdges.length} weighted paths
          </span>
          <span>
            <Gauge size={15} aria-hidden="true" />
            O(V³) precompute
          </span>
        </div>
        <p className="empty-result-note">
          Tip: the planner opens with a sample pair filled in — press{' '}
          <strong>Find Shortest Path</strong> to calculate it.
        </p>
      </section>
    )
  }

  const category = categoryById.get(result.from.category)
  const destinationCategory = categoryById.get(result.to.category)
  const isValidRoute =
    result.status === 'found' || result.status === 'same-location'
  const seconds = result.distance / walkingSpeed
  const stepCount = result.edgeCount

  if (!isValidRoute) {
    const isNegativeCycle = result.status === 'negative-cycle'
    return (
      <section className="results-card result-status-card" aria-live="polite">
        <div className="result-status-icon warning">
          <CircleAlert size={26} aria-hidden="true" />
        </div>
        <span className="eyebrow">{isNegativeCycle ? 'Negative cycle' : 'No route found'}</span>
        <h2>
          {isNegativeCycle
            ? 'This graph contains a negative-weight cycle.'
            : 'The destination is currently unreachable.'}
        </h2>
        <p>
          {isNegativeCycle
            ? 'A shortest path is undefined when a negative-weight cycle is reachable. Review the edge weights before running the algorithm.'
            : `No sequence of walkable paths currently connects ${result.from.name} to ${result.to.name}. Check the graph data and try again.`}
        </p>
        <div className="result-status-actions">
          <button type="button" className="button button-primary" onClick={clearResult}>
            Reset result
          </button>
          <Link to="/map" className="button button-secondary">
            Inspect the campus map
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="results-card" aria-labelledby="route-result-title" aria-live="polite">
      <div className="result-heading">
        <div>
          <span className="result-status-pill">
            <CircleCheck size={14} aria-hidden="true" />
            {result.status === 'same-location'
              ? 'Same start and destination'
              : 'Shortest route found'}
          </span>
          <h2 id="route-result-title">
            {result.status === 'same-location'
              ? 'You are already there.'
              : `${result.from.name} to ${result.to.name}`}
          </h2>
          <p>
            {result.status === 'same-location'
              ? 'Choose a different destination to calculate a walking route.'
              : 'Calculated from the precomputed all-pairs Floyd–Warshall matrix.'}
          </p>
        </div>
        <span className="result-algorithm-badge">
          <span className="mono">dist[</span>
          <span className="mono">{result.from.shortName}</span>
          <span className="mono">][</span>
          <span className="mono">{result.to.shortName}</span>
          <span className="mono">]</span>
        </span>
      </div>

      <div className="result-location-grid">
        <LocationBadge node={result.from} role="start" />
        <span className="result-location-arrow" aria-hidden="true">
          <ArrowRight size={17} />
        </span>
        <LocationBadge node={result.to} role="end" />
      </div>

      <div className="result-metrics">
        <div className="result-metric">
          <span className="metric-icon">
            <Route size={17} aria-hidden="true" />
          </span>
          <span className="metric-label">Shortest distance</span>
          <strong>{formatDistance(result.distance)}</strong>
          <span className="metric-note">sum of {stepCount} edge weights</span>
        </div>
        <div className="result-metric">
          <span className="metric-icon">
            <Clock size={17} aria-hidden="true" />
          </span>
          <span className="metric-label">Estimated walking time</span>
          <strong>{formatWalkTime(seconds)}</strong>
          <span className="metric-note">estimate at {walkingSpeed.toFixed(1)} m/s</span>
        </div>
        <div className="result-metric">
          <span className="metric-icon">
            <Footprints size={17} aria-hidden="true" />
          </span>
          <span className="metric-label">Edges in route</span>
          <strong>{stepCount}</strong>
          <span className="metric-note">
            {result.path.length} location{result.path.length === 1 ? '' : 's'} visited
          </span>
        </div>
      </div>

      {result.status === 'same-location' ? (
        <div className="same-location-note">
          <CircleCheck size={18} aria-hidden="true" />
          <div>
            <strong>Zero distance. Zero walking time.</strong>
            <p>
              The Floyd–Warshall matrix stores a zero on the diagonal for every
              location, so no edges are needed when the start and destination match.
            </p>
          </div>
        </div>
      ) : (
        <div className="result-route-block">
          <div className="result-subheading">
            <div>
              <span className="eyebrow-small">Step by step</span>
              <h3>Complete route sequence</h3>
            </div>
            <span className="result-route-total mono">
              {formatDistance(result.distance)} total
            </span>
          </div>

          <ol className="route-steps" aria-label="Complete route sequence">
            {result.path.map((node, index) => {
              const nodeCategory = categoryById.get(node.category)
              const previousNode = index > 0 ? result.path[index - 1] : null
              const segment = index > 0 ? result.segments[index - 1] : null
              const isStart = index === 0
              const isEnd = index === result.path.length - 1
              return (
                <li key={node.id} className="route-step">
                  {segment && previousNode && (
                    <div className="route-step-edge" aria-hidden="true">
                      <span />
                      <small>{segment.distance} m</small>
                    </div>
                  )}
                  <article
                    className={`route-step-card${isStart ? ' is-start' : ''}${
                      isEnd ? ' is-end' : ''
                    }`}
                  >
                    <span className={`route-step-marker${isEnd ? ' end' : ''}`}>
                      {isStart ? (
                        'S'
                      ) : isEnd ? (
                        'D'
                      ) : (
                        <span className="mono">{String(index).padStart(2, '0')}</span>
                      )}
                    </span>
                    <span
                      className="route-step-icon"
                      style={{
                        color: nodeCategory?.color,
                        backgroundColor: nodeCategory?.tint,
                      }}
                    >
                      <CampusLocationIcon icon={node.icon} size={18} />
                    </span>
                    <span className="route-step-copy">
                      <span className="route-step-role">
                        {isStart
                          ? 'Starting location'
                          : isEnd
                            ? 'Destination'
                            : 'Via'}
                      </span>
                      <strong>{node.name}</strong>
                      <span className="route-step-meta">
                        <CategoryIcon category={node.category} size={11} />
                        {nodeCategory?.shortLabel}
                      </span>
                    </span>
                    {isEnd && (
                      <span className="route-step-end-badge">Arrive here</span>
                    )}
                  </article>
                </li>
              )
            })}
          </ol>
        </div>
      )}

      {result.status === 'found' && (
        <PathSimulationChart result={result} walkingSpeed={walkingSpeed} />
      )}

      {result.status === 'found' && <RoutePreview result={result} />}

      <div className="result-footer">
        <div className="result-footer-note">
          <span
            className="result-footer-dot"
            style={{
              backgroundColor: category?.color,
            }}
            aria-hidden="true"
          />
          <span>
            Total shown is the sum of each highlighted edge. Walking time is an
            estimate at an average pace of {walkingSpeed.toFixed(1)} m/s.
          </span>
          <span
            className="result-footer-dot"
            style={{
              backgroundColor: destinationCategory?.color,
            }}
            aria-hidden="true"
          />
        </div>
        <div className="result-actions">
          <Link to="/map" className="button button-primary button-small">
            <MapPinned size={15} aria-hidden="true" />
            View on campus map
          </Link>
          <button
            type="button"
            className="button button-secondary button-small"
            onClick={clearResult}
          >
            <RotateCcw size={14} aria-hidden="true" />
            Clear route highlight
          </button>
        </div>
      </div>
    </section>
  )
}
