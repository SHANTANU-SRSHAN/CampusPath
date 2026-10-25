import {
  ArrowRight,
  BookOpenCheck,
  Braces,
  GitBranch,
  Layers3,
  Sigma,
  Table2,
  Workflow,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { AlgorithmVisualizer } from '../components/AlgorithmVisualizer'
import { ComplexityAnalysis } from '../components/ComplexityAnalysis'
import { campusEdges, campusNodes } from '../data/campusGraph'

const v = campusNodes.length

const conceptCards = [
  {
    icon: Workflow,
    title: 'Consider one intermediate vertex',
    copy: 'On pass k, every pair is allowed to route through vertex k using the best distances found in earlier passes.',
    term: 'k',
  },
  {
    icon: Layers3,
    title: 'Start from the previous matrix',
    copy: 'Dᵏ⁻¹ holds the best distances after considering vertices 0 through k−1. It is the base for the next comparison.',
    term: 'Dᵏ⁻¹',
  },
  {
    icon: GitBranch,
    title: 'Try the detour',
    copy: 'The candidate route i → k → j is only valid when both segments have finite distances.',
    term: 'i → k → j',
  },
  {
    icon: BookOpenCheck,
    title: 'Keep the minimum',
    copy: 'If going through k is cheaper, update the distance and set the next hop. Otherwise, keep the previous entry.',
    term: 'min()',
  },
]

export function AlgorithmPage() {
  return (
    <div className="algorithm-page">
      <section className="page-intro container algorithm-intro">
        <div>
          <span className="eyebrow">Algorithm visualization</span>
          <h1>Floyd–Warshall, one comparison at a time.</h1>
        </div>
        <p>
          Watch the dynamic programming matrix evolve as every campus location gets a
          turn as the intermediate vertex <span className="mono">k</span>. Values are read
          from the real graph and the actual trace.
        </p>
      </section>

      <div className="container">
        <section className="algorithm-explainer" aria-labelledby="algorithm-explainer-title">
          <div className="algorithm-explainer-main">
            <span className="eyebrow">
              <Sigma size={14} aria-hidden="true" />
              The recurrence
            </span>
            <h2 id="algorithm-explainer-title">
              The shortest route either avoids k or passes through it.
            </h2>
            <div className="algorithm-formula-large">
              <span>
                D<sup>k</sup>[i][j]
              </span>
              <span className="formula-equals">=</span>
              <span className="formula-min">min</span>
              <span className="formula-paren">(</span>
              <span>
                D<sup>k−1</sup>[i][j]
              </span>
              <span>,</span>
              <span>
                D<sup>k−1</sup>[i][k] + D<sup>k−1</sup>[k][j]
              </span>
              <span className="formula-paren">)</span>
            </div>
            <p className="algorithm-explainer-lede">
              Dᵏ[i][j] is the shortest known distance from vertex i to vertex j after
              considering the first k intermediate vertices. The algorithm keeps whichever
              option is smaller.
            </p>
            <div className="algorithm-index-strip">
              <span>
                <strong className="mono">Dᴷ⁻¹[i][j]</strong>
                previously known distance
              </span>
              <span>
                <strong className="mono">Dᴷ⁻¹[i][k] + Dᴷ⁻¹[k][j]</strong>
                route passing through k
              </span>
              <span>
                <strong className="mono">min(…)</strong>
                updated shortest distance
              </span>
            </div>
          </div>

          <div className="algorithm-pseudocode-card">
            <div className="pseudocode-head">
              <span>
                <Braces size={14} aria-hidden="true" />
                Core pass
              </span>
              <span className="mono">O(V³)</span>
            </div>
            <pre>
              <code>{`for k = 0 to V - 1:
  for i = 0 to V - 1:
    for j = 0 to V - 1:

      if dist[i][k] != INF
         and dist[k][j] != INF:

        candidate =
          dist[i][k] + dist[k][j]

        if candidate < dist[i][j]:
          dist[i][j] = candidate
          next[i][j] = next[i][k]`}</code>
            </pre>
            <div className="pseudocode-foot">
              <span>V = {v} locations</span>
              <span>
                {v}³ = {(v ** 3).toLocaleString('en-IN')} cubic vertex combinations
              </span>
            </div>
          </div>
        </section>

        <div className="concept-card-grid">
          {conceptCards.map((card) => {
            const Icon = card.icon
            return (
              <article className="concept-card" key={card.title}>
                <div className="concept-card-top">
                  <span className="concept-card-icon">
                    <Icon size={17} aria-hidden="true" />
                  </span>
                  <span className="concept-term mono">{card.term}</span>
                </div>
                <h3>{card.title}</h3>
                <p>{card.copy}</p>
              </article>
            )
          })}
        </div>

        <AlgorithmVisualizer />
      </div>

      <ComplexityAnalysis />

      <section className="algorithm-footer-cta container">
        <div>
          <span className="eyebrow-small">
            <Table2 size={13} aria-hidden="true" />
            All-pairs result
          </span>
          <h2>The route planner reads this matrix.</h2>
          <p>
            After the {v}³ comparisons, the matrix stores the shortest distance for every
            pair. The planner uses a next-hop matrix to reconstruct the actual walking
            route.
          </p>
        </div>
        <div className="algorithm-footer-actions">
          <Link to="/find-path" className="button button-primary">
            Use the matrix to plan a route
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
          <Link to="/about" className="button button-secondary">
            About the project
          </Link>
        </div>
      </section>

      <div className="algorithm-data-note container">
        <span>
          <strong>{campusEdges.length}</strong> undirected weighted edges initialize the
          matrix. All step values update live from the selected induced graph.
        </span>
        <span className="mono">all values in metres</span>
      </div>
    </div>
  )
}

export default AlgorithmPage
