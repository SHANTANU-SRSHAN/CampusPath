import {
  ArrowRight,
  Check,
  Clock3,
  Database,
  GitCompareArrows,
  Sigma,
  Table2,
  TriangleAlert,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { campusNodes } from '../data/campusGraph'

const v = campusNodes.length
const cubic = v ** 3
const squared = v ** 2

const comparisonRows = [
  ['Problem', 'All-pairs shortest paths'],
  ['Graph representation', 'Weighted adjacency matrix'],
  ['Time complexity', 'O(V³)'],
  ['Space complexity', 'O(V²)'],
  ['Negative edge weights', 'Supported, with no negative cycles'],
  ['Negative cycles', 'Must be detected and handled'],
  ['Campus use case', 'Shortest routes between any two locations'],
]

export function ComplexityAnalysis() {
  return (
    <section className="complexity-section" aria-labelledby="complexity-title">
      <div className="container">
        <div className="section-heading split-heading complexity-heading">
          <div>
            <span className="eyebrow">Analysis of Algorithm</span>
            <h2 id="complexity-title">Three nested loops. A compact all-pairs table.</h2>
          </div>
          <p>
            Floyd–Warshall is a dynamic programming algorithm. Its cost is determined by
            the number of vertices, not the number of user queries.
          </p>
        </div>

        <div className="complexity-metrics">
          <article className="complexity-primary-card">
            <div className="complexity-card-top">
              <span className="complexity-icon">
                <Clock3 size={20} aria-hidden="true" />
              </span>
              <span className="eyebrow-small">Time complexity</span>
            </div>
            <strong className="complexity-big">O(V³)</strong>
            <p>
              The k, i, j loops each visit V vertices. For this graph,{' '}
              <span className="mono">
                {v}³ = {cubic.toLocaleString('en-IN')}
              </span>
              . This is the cubic vertex count — the order of magnitude, not an exact
              count of every operation executed.
            </p>
            <div className="complexity-formula-line mono">
              V³ = {v} × {v} × {v} = {cubic.toLocaleString('en-IN')}
            </div>
          </article>

          <article className="complexity-card">
            <span className="complexity-icon">
              <Database size={19} aria-hidden="true" />
            </span>
            <span className="eyebrow-small">Space complexity</span>
            <strong>O(V²)</strong>
            <p>
              A distance matrix stores {squared.toLocaleString('en-IN')} entries. The
              next-hop matrix adds another {squared.toLocaleString('en-IN')} integers, for{' '}
              {(squared * 2).toLocaleString('en-IN')} numeric cells in total.
            </p>
            <span className="complexity-footnote">2 × V² auxiliary matrix entries</span>
          </article>

          <article className="complexity-card">
            <span className="complexity-icon">
              <Table2 size={19} aria-hidden="true" />
            </span>
            <span className="eyebrow-small">Query cost</span>
            <strong>O(1)</strong>
            <p>
              Once the matrices are built, looking up any pair&apos;s distance is a direct
              index: <span className="mono">dist[i][j]</span>. Path reconstruction costs
              O(path length).
            </p>
            <span className="complexity-footnote">Precompute once, query repeatedly</span>
          </article>
        </div>

        <div className="complexity-detail-grid">
          <article className="complexity-copy-card">
            <span className="eyebrow-small">Why all-pairs?</span>
            <h3>Any source. Any destination. One precomputation.</h3>
            <p>
              Campus users can begin in a hostel and end at a laboratory, or start at a
              gate and finish at a department. Floyd–Warshall answers every possible pair
              in one run, so the route planner never needs to know the query in advance.
            </p>
            <ul className="academic-list">
              <li>
                <Check size={15} aria-hidden="true" />
                Suitable when the all-pairs distance table is useful on its own.
              </li>
              <li>
                <Check size={15} aria-hidden="true" />
                Naturally represented with a weighted adjacency matrix.
              </li>
              <li>
                <Check size={15} aria-hidden="true" />
                Supports negative edge weights if there are no negative-weight cycles.
              </li>
            </ul>
          </article>

          <article className="complexity-copy-card">
            <span className="eyebrow-small">
              <GitCompareArrows size={13} aria-hidden="true" />
              Compared with repeated single-source runs
            </span>
            <h3>A different tradeoff, not a universal winner.</h3>
            <p>
              Running a single-source algorithm such as Dijkstra once per vertex also
              produces all-pairs distances. On sparse graphs that can be more efficient,
              typically around O(V · (E + V) log V) with a heap. Floyd–Warshall instead
              uses a simple, dense cubic dynamic program with no priority queue.
            </p>
            <p>
              CampusPath uses Floyd–Warshall because the course focus is all-pairs dynamic
              programming, the graph is only {v} vertices, and the matrix makes every route
              query an immediate lookup. Ordinary walking distances are nonnegative, so
              Dijkstra would also be valid; the choice here is pedagogical and uniform.
            </p>
            <div className="negative-warning">
              <TriangleAlert size={17} aria-hidden="true" />
              <span>
                Negative edge weights are supported, but a negative cycle makes the
                shortest path undefined. The implementation checks the final diagonal for
                negative values and reports a cycle.
              </span>
            </div>
          </article>
        </div>

        <div className="complexity-table-card">
          <div className="complexity-table-head">
            <div>
              <span className="eyebrow-small">
                <Sigma size={13} aria-hidden="true" />
                At a glance
              </span>
              <h3>Algorithm comparison</h3>
            </div>
            <Link to="/algorithm" className="text-link">
              Open the visualizer
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
          <div className="table-scroll">
            <table className="algorithm-comparison-table">
              <thead>
                <tr>
                  <th scope="col">Property</th>
                  <th scope="col">Floyd–Warshall</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map(([property, value]) => (
                  <tr key={property}>
                    <th scope="row">{property}</th>
                    <td>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}
