import {
  ArrowRight,
  ArrowUpRight,
  Compass,
  Footprints,
  Gauge,
  MapPinned,
  Network,
  Table2,
  Waypoints,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { HeroCampusGraph } from '../components/HeroCampusGraph'
import { useRoute } from '../context/RouteContext'
import { campusEdges, campusNodes } from '../data/campusGraph'
import { countFiniteMatrixPairs, reconstructPath } from '../lib/floydWarshall'
import { formatDistance, formatWalkTimeShort } from '../lib/format'

const features = [
  {
    icon: Network,
    kicker: 'Shared graph model',
    title: 'One map. One source of truth.',
    copy:
      'The interactive map, route planner, and algorithm lab all read the same weighted adjacency data. Nothing is drawn from a separate mock dataset.',
    link: { label: 'Explore the campus map', to: '/map' },
  },
  {
    icon: Table2,
    kicker: 'All-pairs shortest paths',
    title: 'Any start. Any destination.',
    copy:
      'One Floyd–Warshall pass fills 1,444 distance entries. The route planner reads the matrix and reconstructs the ordered path in constant lookup time.',
    link: { label: 'Calculate a route', to: '/find-path' },
  },
  {
    icon: Gauge,
    kicker: 'Built for the AOA lab',
    title: 'Watch the dynamic program think.',
    copy:
      'Step through every k, i, j comparison, see amber evaluations and green updates, then compare the live matrix with the recurrence.',
    link: { label: 'Open the visualizer', to: '/algorithm' },
  },
]

export function HomePage() {
  const { allPairs } = useRoute()
  const shortestPaths = countFiniteMatrixPairs(allPairs)
  const v = campusNodes.length
  const complexity = v ** 3
  const pace = 1.3
  const sampleRoute = reconstructPath(allPairs, 'main-gate-1', 'programming-lab')

  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-orbit hero-orbit-one" aria-hidden="true" />
        <div className="hero-orbit hero-orbit-two" aria-hidden="true" />
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="eyebrow-pill">
              <span className="eyebrow-dot" aria-hidden="true" />
              AOA Laboratory Project
              <span className="eyebrow-separator" aria-hidden="true" />
              Graph Algorithms
            </div>
            <h1>
              Shortest paths across campus,
              <br />
              <span className="hero-title-accent">computed instantly.</span>
            </h1>
            <p className="hero-lede">
              Enter any two locations. CampusPath returns the shortest walking route
              from the precomputed Floyd–Warshall matrix, with distance, time, and a
              step-by-step breakdown.
            </p>
            <div className="hero-actions">
              <Link to="/find-path" className="button button-primary button-large">
                <Compass size={18} aria-hidden="true" />
                Calculate Shortest Path
              </Link>
              <Link to="/map" className="button button-secondary button-large">
                <MapPinned size={18} aria-hidden="true" />
                Explore Campus Map
              </Link>
            </div>
            <div className="hero-graph-meta" aria-label="Graph summary">
              <span>
                <span className="meta-number">{v}</span> locations
              </span>
              <span className="meta-divider" aria-hidden="true" />
              <span>
                <span className="meta-number">{campusEdges.length}</span> connections
              </span>
              <span className="meta-divider" aria-hidden="true" />
              <span>
                <span className="meta-check">✓</span> fully connected
              </span>
            </div>

            <Link to="/find-path" className="hero-live-route">
              <span className="live-route-icon">
                <Footprints size={16} aria-hidden="true" />
              </span>
              <span className="live-route-copy">
                <span className="eyebrow-small">Sample query</span>
                <span>
                  Main Gate 1 to Programming Lab
                  <em>
                    {' '}
                    · {formatDistance(sampleRoute.distance)} ·{' '}
                    {formatWalkTimeShort(sampleRoute.distance / pace)}
                  </em>
                </span>
              </span>
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>

          <div className="hero-visual">
            <div className="hero-visual-backdrop" aria-hidden="true" />
            <HeroCampusGraph />
          </div>
        </div>
      </section>

      <section className="stats-section" aria-labelledby="campus-stats-heading">
        <div className="container">
          <h2 id="campus-stats-heading" className="sr-only">
            Campus graph statistics
          </h2>
          <div className="stats-panel">
            <div className="stat-item">
              <span className="stat-icon">
                <MapPinned size={19} aria-hidden="true" />
              </span>
              <div>
                <strong className="stat-value">{campusNodes.length}</strong>
                <span className="stat-label">Total locations</span>
                <span className="stat-detail">V = {v} vertices</span>
              </div>
            </div>
            <div className="stat-item">
              <span className="stat-icon">
                <Waypoints size={19} aria-hidden="true" />
              </span>
              <div>
                <strong className="stat-value">{campusEdges.length}</strong>
                <span className="stat-label">Total connections</span>
                <span className="stat-detail">weighted walking paths</span>
              </div>
            </div>
            <div className="stat-item">
              <span className="stat-icon">
                <Table2 size={19} aria-hidden="true" />
              </span>
              <div>
                <strong className="stat-value">
                  {shortestPaths.toLocaleString('en-IN')}
                </strong>
                <span className="stat-label">Shortest paths computed</span>
                <span className="stat-detail">finite all-pairs entries</span>
              </div>
            </div>
            <div className="stat-item">
              <span className="stat-icon">
                <Gauge size={19} aria-hidden="true" />
              </span>
              <div>
                <strong className="stat-value">O(V³)</strong>
                <span className="stat-label">Algorithm complexity</span>
                <span className="stat-detail">
                  {v}³ = {complexity.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="home-section features-section">
        <div className="container">
          <div className="section-heading split-heading">
            <div>
              <span className="eyebrow">A graph you can walk through</span>
              <h2>Everything begins with a connected campus.</h2>
            </div>
            <p>
              CampusPath treats the college as a weighted graph, then lets the
              algorithm do the navigating. Explore the model from every angle.
            </p>
          </div>

          <div className="feature-grid">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <article className="feature-card" key={feature.title}>
                  <div className="feature-icon">
                    <Icon size={22} strokeWidth={1.7} aria-hidden="true" />
                  </div>
                  <span className="eyebrow-small">{feature.kicker}</span>
                  <h3>{feature.title}</h3>
                  <p>{feature.copy}</p>
                  <Link to={feature.link.to} className="text-link">
                    {feature.link.label}
                    <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="home-cta-section">
        <div className="container">
          <div className="home-cta">
            <div className="home-cta-pattern" aria-hidden="true" />
            <div>
              <span className="eyebrow-small">Ready when you are</span>
              <h2>Pick a start. Pick a destination. Follow the shortest path.</h2>
            </div>
            <div className="home-cta-actions">
              <Link to="/find-path" className="button button-light">
                Find a Route
                <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
              <Link to="/map" className="button button-ghost-light">
                Open campus map
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
