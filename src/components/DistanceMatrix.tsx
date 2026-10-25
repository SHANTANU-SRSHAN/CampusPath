import { useEffect, useRef } from 'react'
import { CornerDownRight, Sigma } from 'lucide-react'
import type { CampusNode } from '../data/campusGraph'
import type { ComparisonRecord } from '../lib/floydWarshall'
import { formatMatrixValue } from '../lib/format'

interface DistanceMatrixProps {
  nodes: CampusNode[]
  dist: number[][]
  lastRecord: ComparisonRecord | null
  executed: number
  totalSteps: number
  updatedCellsThisK: Set<string>
  complete: boolean
  allScope: boolean
  negativeCycle: boolean
}

export function DistanceMatrix({
  nodes,
  dist,
  lastRecord,
  executed,
  totalSteps,
  updatedCellsThisK,
  complete,
  allScope,
  negativeCycle,
}: DistanceMatrixProps) {
  const currentCellRef = useRef<HTMLTableCellElement | null>(null)

  useEffect(() => {
    if (!lastRecord) return
    const frame = window.requestAnimationFrame(() => {
      currentCellRef.current?.scrollIntoView({
        block: 'nearest',
        inline: 'nearest',
      })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [executed, lastRecord])

  const kNode = lastRecord ? nodes[lastRecord.k] : null
  const rowNode = lastRecord ? nodes[lastRecord.i] : null
  const colNode = lastRecord ? nodes[lastRecord.j] : null

  return (
    <section className="matrix-card" aria-labelledby="matrix-title">
      <div className="matrix-head">
        <div>
          <span className="eyebrow-small">
            <Sigma size={13} aria-hidden="true" />
            Distance matrix D
          </span>
          <h3 id="matrix-title">
            {complete ? 'Final all-pairs distances' : 'Live shortest-distance matrix'}
          </h3>
        </div>
        <div className="matrix-head-meta">
          {complete ? (
            <span className="matrix-complete-pill">Complete</span>
          ) : (
            <span className="matrix-step-pill mono">
              step {executed.toLocaleString('en-IN')} /{' '}
              {totalSteps.toLocaleString('en-IN')}
            </span>
          )}
          <span className="matrix-size-pill mono">
            {nodes.length} × {nodes.length}
          </span>
        </div>
      </div>

      <div className="matrix-context">
        <div className="matrix-context-item">
          <span className="matrix-context-label">Intermediate k</span>
          <strong>
            {lastRecord ? (
              <>
                <span className="mono">k = {lastRecord.k}</span>
                <span className="matrix-k-name">{kNode?.name ?? '—'}</span>
              </>
            ) : (
              'Not started'
            )}
          </strong>
        </div>
        <div className="matrix-context-item">
          <span className="matrix-context-label">Current comparison</span>
          <strong>
            {lastRecord ? (
              <span className="matrix-comparison-inline">
                {rowNode?.shortName} <CornerDownRight size={12} aria-hidden="true" />{' '}
                {colNode?.shortName}
              </span>
            ) : (
              'D⁰ initial state'
            )}
          </strong>
        </div>
        {negativeCycle && (
          <span className="matrix-cycle-warning">Negative cycle detected</span>
        )}
      </div>

      <div className="matrix-legend" aria-label="Matrix color legend">
        <span>
          <i className="legend-swatch current" aria-hidden="true" />
          Evaluating
        </span>
        <span>
          <i className="legend-swatch updated" aria-hidden="true" />
          Updated
        </span>
        <span>
          <i className="legend-swatch kline" aria-hidden="true" />
          Row / column k
        </span>
        <span>
          <i className="legend-swatch infinity" aria-hidden="true" />
          No path (∞)
        </span>
      </div>

      <div className={`matrix-scroll${allScope ? ' matrix-scroll-large' : ''}`}>
        <table className={`distance-matrix${allScope ? ' is-large' : ''}`}>
          <caption className="sr-only">
            Floyd–Warshall distance matrix for {nodes.length} campus locations, after{' '}
            {executed} of {totalSteps} comparisons.
          </caption>
          <thead>
            <tr>
              <th scope="col" className="matrix-corner">
                <span>from</span>
                <span>to</span>
              </th>
              {nodes.map((node, index) => (
                <th
                  key={node.id}
                  scope="col"
                  title={node.name}
                  className={lastRecord?.k === index ? 'is-k-line' : ''}
                >
                  {node.shortName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {nodes.map((rowNodeItem, rowIndex) => (
              <tr key={rowNodeItem.id}>
                <th
                  scope="row"
                  title={rowNodeItem.name}
                  className={lastRecord?.k === rowIndex ? 'is-k-line' : ''}
                >
                  <span className="matrix-row-short">{rowNodeItem.shortName}</span>
                  {!allScope && <span className="matrix-row-name">{rowNodeItem.name}</span>}
                </th>
                {nodes.map((colNodeItem, colIndex) => {
                  const value = dist[rowIndex]?.[colIndex] ?? Infinity
                  const isCurrent =
                    lastRecord?.i === rowIndex && lastRecord?.j === colIndex
                  const isUpdatedThisK = updatedCellsThisK.has(`${rowIndex}-${colIndex}`)
                  const isDiagonal = rowIndex === colIndex
                  const isInfinite = !Number.isFinite(value)

                  return (
                    <td
                      key={colNodeItem.id}
                      ref={isCurrent ? currentCellRef : undefined}
                      title={`${rowNodeItem.name} → ${colNodeItem.name}: ${
                        isInfinite ? 'no path' : `${Math.round(value)} m`
                      }${isCurrent ? ' · current comparison' : ''}`}
                      aria-label={`${rowNodeItem.name} to ${colNodeItem.name}: ${
                        isInfinite ? 'no path' : `${Math.round(value)} meters`
                      }`}
                      className={[
                        isCurrent ? 'is-current' : '',
                        isCurrent && lastRecord?.updated ? 'is-updated' : '',
                        !isCurrent && isUpdatedThisK ? 'is-updated-k' : '',
                        isDiagonal ? 'is-diagonal' : '',
                        isInfinite ? 'is-infinity' : '',
                        lastRecord?.k === rowIndex || lastRecord?.k === colIndex
                          ? 'is-k-line'
                          : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {formatMatrixValue(value)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="matrix-footer">
        <p>
          D<sup>k</sup> is rebuilt from the selected edges. Diagonal entries are zero;
          unreachable pairs show <span className="mono">∞</span>.
        </p>
        <span className="mono">
          {complete ? 'FINAL' : `STEP ${executed}`} · k = {lastRecord?.k ?? 0}
        </span>
      </div>
    </section>
  )
}
