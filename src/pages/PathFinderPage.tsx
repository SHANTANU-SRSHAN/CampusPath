import {
  ArrowLeftRight,
  ArrowRight,
  Calculator,
  Check,
  CircleHelp,
  Clock,
  Gauge,
  MapPinned,
  Route,
  RotateCcw,
  Table2,
} from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { LocationSelect } from '../components/LocationSelect'
import { ShortestPathResults } from '../components/ShortestPathResults'
import { useRoute } from '../context/RouteContext'
import { campusEdges, campusNodes, SAMPLE_DATA_NOTE } from '../data/campusGraph'
import { countFiniteMatrixPairs } from '../lib/floydWarshall'

const paceOptions = [
  { value: 1.1, label: 'Leisurely', note: '1.1 m/s' },
  { value: 1.3, label: 'Average', note: '1.3 m/s' },
  { value: 1.5, label: 'Brisk', note: '1.5 m/s' },
]

export function PathFinderPage() {
  const {
    sourceId,
    destinationId,
    allPairs,
    walkingSpeed,
    setSourceId,
    setDestinationId,
    setWalkingSpeed,
    calculateRoute,
    swapLocations,
    clearSelection,
  } = useRoute()
  const [error, setError] = useState('')

  const canCalculate = Boolean(sourceId && destinationId)
  const finitePairs = countFiniteMatrixPairs(allPairs)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!sourceId || !destinationId) {
      setError('Choose both a starting location and a destination.')
      return
    }
    setError('')
    calculateRoute()
  }

  return (
    <div className="finder-page">
      <section className="page-intro container finder-intro">
        <div>
          <span className="eyebrow">Route planner</span>
          <h1>Find the shortest way across campus.</h1>
        </div>
        <p>
          Choose any two locations. CampusPath reads their shortest distance from the
          Floyd–Warshall matrix, reconstructs the route, and draws it back on the graph.
        </p>
      </section>

      <div className="container planner-layout">
        <section className="planner-card" aria-labelledby="planner-title">
          <div className="planner-card-head">
            <div>
              <span className="eyebrow-small">Plan a walk</span>
              <h2 id="planner-title">Choose your two points</h2>
            </div>
            <span className="planner-ready-pill">
              <span className="status-dot" aria-hidden="true" />
              Matrix ready
            </span>
          </div>

          <form onSubmit={handleSubmit} className="planner-form">
            <LocationSelect
              label="Starting location"
              marker="start"
              value={sourceId}
              onChange={(value) => {
                setSourceId(value)
                setError('')
              }}
              placeholder="Search for a starting point…"
              helper={`Any of the ${campusNodes.length} campus locations.`}
            />

            <div className="planner-swap-row">
              <span className="planner-swap-line" aria-hidden="true" />
              <button
                type="button"
                className="planner-swap-button"
                onClick={() => {
                  swapLocations()
                  setError('')
                }}
                aria-label="Swap starting location and destination"
                disabled={!sourceId && !destinationId}
              >
                <ArrowLeftRight size={15} aria-hidden="true" />
                Swap locations
              </button>
              <span className="planner-swap-line" aria-hidden="true" />
            </div>

            <LocationSelect
              label="Destination"
              marker="end"
              value={destinationId}
              onChange={(value) => {
                setDestinationId(value)
                setError('')
              }}
              placeholder="Search for a destination…"
              helper={`Any of the ${campusNodes.length} campus locations.`}
            />

            <div className="planner-preference">
              <span className="planner-preference-icon">
                <Route size={17} aria-hidden="true" />
              </span>
              <div className="planner-preference-copy">
                <span className="eyebrow-small">Distance preference</span>
                <strong>Shortest walking distance</strong>
                <p>Route chosen by minimum sum of configured edge weights.</p>
              </div>
              <span className="planner-preference-badge">
                <Check size={12} aria-hidden="true" />
                Active
              </span>
            </div>

            <div className="pace-selector">
              <div className="pace-heading">
                <span>
                  <Clock size={15} aria-hidden="true" />
                  Walking pace
                </span>
                <small>Used for the time estimate only</small>
              </div>
              <div className="pace-options" role="group" aria-label="Average walking pace">
                {paceOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`pace-option${
                      Math.abs(walkingSpeed - option.value) < 0.01 ? ' active' : ''
                    }`}
                    onClick={() => setWalkingSpeed(option.value)}
                    aria-pressed={Math.abs(walkingSpeed - option.value) < 0.01}
                  >
                    <span>{option.label}</span>
                    <small>{option.note}</small>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="planner-error" role="alert">
                <CircleHelp size={15} aria-hidden="true" />
                {error}
              </p>
            )}

            <button
              type="submit"
              className="button button-primary planner-submit"
              disabled={!canCalculate}
            >
              <Calculator size={17} aria-hidden="true" />
              Find Shortest Path
              <ArrowRight size={16} aria-hidden="true" />
            </button>

            <div className="planner-secondary-actions">
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  swapLocations()
                  setError('')
                }}
                disabled={!sourceId && !destinationId}
              >
                <ArrowLeftRight size={14} aria-hidden="true" />
                Swap locations
              </button>
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  clearSelection()
                  setError('')
                }}
              >
                <RotateCcw size={14} aria-hidden="true" />
                Clear selection
              </button>
            </div>

            {!canCalculate && (
              <p className="planner-hint">
                Select both locations to enable the calculation.
              </p>
            )}
          </form>

          <div className="planner-algorithm-note">
            <span className="planner-algorithm-icon">
              <Table2 size={17} aria-hidden="true" />
            </span>
            <div>
              <strong>Looked up, not re-computed</strong>
              <p>
                The {campusNodes.length} × {campusNodes.length} all-pairs matrix holds{' '}
                {finitePairs.toLocaleString('en-IN')} finite entries. Selecting a pair
                simply reads the result and rebuilds the path.
              </p>
            </div>
          </div>
        </section>

        <div className="finder-results-column">
          <ShortestPathResults walkingSpeed={walkingSpeed} />

          <div className="finder-method-strip">
            <div className="method-item">
              <Gauge size={16} aria-hidden="true" />
              <span>
                Precomputed in <strong className="mono">O(V³)</strong>
              </span>
            </div>
            <div className="method-item">
              <MapPinned size={16} aria-hidden="true" />
              <span>Route drawn from the live graph</span>
            </div>
            <Link to="/algorithm" className="method-link">
              See how the matrix is built
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>

      <div className="container finder-footnote-row">
        <span>{SAMPLE_DATA_NOTE}</span>
        <span>
          {campusNodes.length} vertices · {campusEdges.length} undirected edges ·
          connected graph
        </span>
      </div>
    </div>
  )
}

export default PathFinderPage
