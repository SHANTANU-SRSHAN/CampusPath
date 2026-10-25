import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Gauge,
  Info,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Table2,
} from 'lucide-react'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from 'react'
import {
  CATEGORIES,
  campusEdges,
  campusNodeById,
  campusNodes,
  categoryById,
  type CampusNode,
} from '../data/campusGraph'
import {
  cloneMatrix,
  traceFloydWarshall,
  type ComparisonRecord,
  type FloydTrace,
} from '../lib/floydWarshall'
import { formatDistance } from '../lib/format'
import { CategoryIcon, CampusLocationIcon } from './CampusIcon'
import { DistanceMatrix } from './DistanceMatrix'

type ScopeMode = 'focused' | 'all'

const DEFAULT_FOCUSED_IDS = [
  'main-gate-1',
  'admission-cell',
  'tpo-cell',
  'library',
  'cse-department',
  'programming-lab',
  'department-cell',
  'ai-ml-lab',
]

const MAX_FOCUSED = 10
const MIN_FOCUSED = 2
const DEFAULT_PLAY_SPEED = 560

function formatComparisonValue(value: number): string {
  return Number.isFinite(value) ? formatDistance(value) : '∞ (no path)'
}

function getUpdatedCells(records: ComparisonRecord[], executed: number, k: number) {
  const cells = new Set<string>()
  for (let index = 0; index < executed; index += 1) {
    const record = records[index]
    if (record.k === k && record.updated) {
      cells.add(`${record.i}-${record.j}`)
    }
  }
  return cells
}

interface MatrixPlayerProps {
  trace: FloydTrace
  nodes: CampusNode[]
  allScope: boolean
}

function MatrixPlayer({ trace, nodes, allScope }: MatrixPlayerProps) {
  const initialState = useCallback(
    () => ({
      dist: cloneMatrix(trace.initialDist),
      next: cloneMatrix(trace.initialNext),
      executed: 0,
      lastRecord: null as ComparisonRecord | null,
      updates: 0,
    }),
    [trace],
  )

  const [player, setPlayer] = useState(initialState)
  const [playing, setPlaying] = useState(false)
  const [playSpeed, setPlaySpeed] = useState(DEFAULT_PLAY_SPEED)
  const totalSteps = trace.records.length

  const totalUpdates = useMemo(
    () => trace.records.reduce((count, record) => count + (record.updated ? 1 : 0), 0),
    [trace.records],
  )

  const complete = player.executed >= totalSteps
  const lastRecord = player.lastRecord
  const upcomingRecord = complete ? null : trace.records[player.executed] ?? null
  const currentK = lastRecord?.k ?? upcomingRecord?.k ?? 0
  const currentKNode = nodes[currentK]
  const progress =
    totalSteps === 0 ? 0 : Math.min(100, (player.executed / totalSteps) * 100)

  const updatedCellsThisK = useMemo(
    () => getUpdatedCells(trace.records, player.executed, currentK),
    [currentK, player.executed, trace.records],
  )

  const advance = useCallback(() => {
    setPlayer((previous) => {
      if (previous.executed >= totalSteps) return previous
      const record = trace.records[previous.executed]
      let dist = previous.dist
      let next = previous.next
      if (record.updated) {
        dist = cloneMatrix(previous.dist)
        next = cloneMatrix(previous.next)
        dist[record.i][record.j] = record.newDistance
        next[record.i][record.j] = record.newNext
      }
      return {
        dist,
        next,
        executed: previous.executed + 1,
        lastRecord: record,
        updates: previous.updates + (record.updated ? 1 : 0),
      }
    })
  }, [totalSteps, trace.records])

  useEffect(() => {
    if (!playing) return
    if (complete) {
      setPlaying(false)
      return
    }
    const timer = window.setTimeout(advance, playSpeed)
    return () => window.clearTimeout(timer)
  }, [advance, complete, playSpeed, playing, player.executed])

  const goToPrevious = () => {
    setPlaying(false)
    setPlayer((previous) => {
      if (previous.executed === 0) return previous
      const record = trace.records[previous.executed - 1]
      let dist = previous.dist
      let next = previous.next
      if (record.updated) {
        dist = cloneMatrix(previous.dist)
        next = cloneMatrix(previous.next)
        dist[record.i][record.j] = record.previousDistance
        next[record.i][record.j] = record.previousNext
      }
      const executed = previous.executed - 1
      return {
        dist,
        next,
        executed,
        lastRecord: executed > 0 ? trace.records[executed - 1] : null,
        updates: Math.max(0, previous.updates - (record.updated ? 1 : 0)),
      }
    })
  }

  const initialize = () => {
    setPlaying(false)
    setPlayer(initialState())
  }

  const reset = () => {
    setPlaying(false)
    setPlaySpeed(DEFAULT_PLAY_SPEED)
    setPlayer(initialState())
  }

  const runComplete = () => {
    setPlaying(false)
    setPlayer({
      dist: cloneMatrix(trace.finalDist),
      next: cloneMatrix(trace.finalNext),
      executed: totalSteps,
      lastRecord: totalSteps ? trace.records[totalSteps - 1] : null,
      updates: totalUpdates,
    })
  }

  const recentUpdates = useMemo(() => {
    const found: ComparisonRecord[] = []
    for (
      let index = player.executed - 1;
      index >= 0 && found.length < 4;
      index -= 1
    ) {
      if (trace.records[index].updated) found.push(trace.records[index])
    }
    return found
  }, [player.executed, trace.records])

  const fromNode = lastRecord ? nodes[lastRecord.i] : null
  const toNode = lastRecord ? nodes[lastRecord.j] : null
  const viaNode = lastRecord ? nodes[lastRecord.k] : null

  const explanation = (() => {
    if (!lastRecord || !fromNode || !toNode || !viaNode) {
      return (
        <>
          The initial distance matrix is ready. Direct neighbours use their edge
          weights, every other non-diagonal pair starts at infinity, and each diagonal
          starts at zero. Press <strong>Next Step</strong> or <strong>Play</strong> to
          begin the first k-pass.
        </>
      )
    }

    if (lastRecord.updated) {
      return (
        <>
          The previous distance from <strong>{fromNode.name}</strong> to{' '}
          <strong>{toNode.name}</strong> was{' '}
          <strong>{formatComparisonValue(lastRecord.previousDistance)}</strong>. Routing
          through <strong>{viaNode.name}</strong> costs{' '}
          <strong>{formatComparisonValue(lastRecord.newDistance)}</strong>, which is
          shorter. The matrix entry is updated.
        </>
      )
    }

    if (!Number.isFinite(lastRecord.viaDistance)) {
      return (
        <>
          There is no finite route through <strong>{viaNode.name}</strong> from{' '}
          <strong>{fromNode.name}</strong> to <strong>{toNode.name}</strong>, so the
          current entry stays at{' '}
          <strong>{formatComparisonValue(lastRecord.previousDistance)}</strong>.
        </>
      )
    }

    return (
      <>
        The existing distance from <strong>{fromNode.name}</strong> to{' '}
        <strong>{toNode.name}</strong> is{' '}
        <strong>{formatComparisonValue(lastRecord.previousDistance)}</strong>. The
        alternative through <strong>{viaNode.name}</strong> costs{' '}
        <strong>{formatComparisonValue(lastRecord.viaDistance)}</strong>, which is not
        shorter. This entry is left unchanged.
      </>
    )
  })()

  const statusLabel = complete
    ? 'Algorithm complete'
    : playing
      ? 'Playing'
      : player.executed === 0
        ? 'Matrix initialized'
        : 'Paused'

  return (
    <div className="viz-stage">
      <div className="viz-control-card">
        <div className="viz-progress">
          <div className="viz-progress-title">
            <span className={`viz-status${complete ? ' is-complete' : ''}`}>
              <span className="status-dot" aria-hidden="true" />
              {statusLabel}
            </span>
            <span className="mono viz-step-count">
              {player.executed.toLocaleString('en-IN')} /{' '}
              {totalSteps.toLocaleString('en-IN')} comparisons
            </span>
          </div>
          <h3 className="viz-k-heading">
            <span className="viz-k-token">k</span>
            Intermediate vertex {currentK} of {nodes.length - 1}
            <span className="viz-k-name">{currentKNode?.name ?? '—'}</span>
          </h3>
          <div
            className="viz-progress-track"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
            aria-label="Algorithm execution progress"
          >
            <span style={{ width: `${progress}%` }} />
          </div>
          {upcomingRecord && (
            <p className="viz-next-up">
              Next up:{' '}
              <span className="mono">
                i = {upcomingRecord.i} → j = {upcomingRecord.j} through k ={' '}
                {upcomingRecord.k}
              </span>
            </p>
          )}
        </div>

        <div className="viz-control-panel">
          <div className="viz-controls">
            <button type="button" className="viz-button" onClick={initialize}>
              <Table2 size={15} aria-hidden="true" />
              Initialize Matrix
            </button>
            <div className="viz-transport" aria-label="Step controls">
              <button
                type="button"
                className="viz-icon-button"
                onClick={goToPrevious}
                disabled={player.executed === 0}
                aria-label="Previous step"
                title="Previous step"
              >
                <ChevronLeft size={16} aria-hidden="true" />
                Previous Step
              </button>
              <button
                type="button"
                className="viz-play-button"
                onClick={() => {
                  setPlaying((current) => !current)
                }}
                disabled={complete}
                aria-label={playing ? 'Pause algorithm' : 'Play algorithm'}
              >
                {playing ? (
                  <Pause size={16} aria-hidden="true" />
                ) : (
                  <Play size={16} aria-hidden="true" />
                )}
                {playing ? 'Pause' : 'Play'}
              </button>
              <button
                type="button"
                className="viz-icon-button"
                onClick={() => {
                  setPlaying(false)
                  advance()
                }}
                disabled={complete}
                aria-label="Next step"
                title="Next step"
              >
                <ChevronRight size={16} aria-hidden="true" />
                Next Step
              </button>
            </div>
            <button
              type="button"
              className="button button-primary viz-run-button"
              onClick={runComplete}
              disabled={complete}
            >
              <Sparkles size={15} aria-hidden="true" />
              Run Complete Algorithm
            </button>
            <button
              type="button"
              className="viz-button viz-reset-button"
              onClick={reset}
            >
              <RotateCcw size={15} aria-hidden="true" />
              Reset
            </button>
          </div>

          <div className="viz-control-meta">
            <div className="viz-speed-control">
              <label htmlFor="viz-speed">Playback</label>
              <select
                id="viz-speed"
                value={playSpeed}
                onChange={(event) => setPlaySpeed(Number(event.target.value))}
              >
                <option value={1000}>Slow · 1.0s</option>
                <option value={560}>Normal · 0.56s</option>
                <option value={220}>Fast · 0.22s</option>
                <option value={80}>Rapid · 0.08s</option>
              </select>
            </div>
            <div className="viz-counter">
              <span>
                Step <strong className="mono">{player.executed.toLocaleString('en-IN')}</strong>
              </span>
              <span className="viz-counter-divider" aria-hidden="true" />
              <span>
                Updates{' '}
                <strong className="mono">{player.updates.toLocaleString('en-IN')}</strong>
              </span>
            </div>
            <span className="viz-keyboard-hint">
              <Info size={13} aria-hidden="true" />
              Previous and Next move one comparison at a time
            </span>
          </div>
        </div>
      </div>

      <div className="viz-content-grid">
        <DistanceMatrix
          nodes={nodes}
          dist={player.dist}
          lastRecord={lastRecord}
          executed={player.executed}
          totalSteps={totalSteps}
          updatedCellsThisK={updatedCellsThisK}
          complete={complete}
          allScope={allScope}
          negativeCycle={trace.negativeCycle}
        />

        <aside className="viz-explanation-card" aria-labelledby="comparison-title">
          <div className="viz-explanation-head">
            <div>
              <span className="eyebrow-small">
                <BookOpen size={13} aria-hidden="true" />
                Latest comparison
              </span>
              <h3 id="comparison-title">
                {lastRecord
                  ? `Is ${fromNode?.shortName} → ${toNode?.shortName} shorter via ${viaNode?.shortName}?`
                  : 'The initial matrix is ready'}
              </h3>
            </div>
            {lastRecord && (
              <span
                className={`comparison-status ${
                  lastRecord.updated ? 'updated' : 'unchanged'
                }`}
              >
                {lastRecord.updated ? (
                  <>
                    <Check size={13} aria-hidden="true" />
                    Updated
                  </>
                ) : (
                  'No change'
                )}
              </span>
            )}
          </div>

          {lastRecord && fromNode && toNode && viaNode ? (
            <>
              <div className="comparison-identifiers">
                <span>
                  <span className="mono comparison-index">i = {lastRecord.i}</span>
                  <strong>{fromNode.name}</strong>
                  <small>source</small>
                </span>
                <ChevronRight size={15} aria-hidden="true" />
                <span>
                  <span className="mono comparison-index">j = {lastRecord.j}</span>
                  <strong>{toNode.name}</strong>
                  <small>destination</small>
                </span>
              </div>
              <div className="comparison-via">
                <span className="mono">k = {lastRecord.k}</span>
                <span>
                  via <strong>{viaNode.name}</strong>
                </span>
              </div>

              <div className="comparison-values">
                <div className="comparison-value previous">
                  <span>
                    D<sup>k−1</sup>[i][j]
                  </span>
                  <strong>{formatComparisonValue(lastRecord.previousDistance)}</strong>
                  <small>previous distance</small>
                </div>
                <div className="comparison-value via">
                  <span>
                    D[i][k] + D[k][j]
                  </span>
                  <strong>{formatComparisonValue(lastRecord.viaDistance)}</strong>
                  <small>route through k</small>
                </div>
                <div
                  className={`comparison-value result${
                    lastRecord.updated ? ' is-updated' : ''
                  }`}
                >
                  <span>
                    D<sup>k</sup>[i][j]
                  </span>
                  <strong>{formatComparisonValue(lastRecord.newDistance)}</strong>
                  <small>{lastRecord.updated ? 'updated minimum' : 'minimum stays'}</small>
                </div>
              </div>

              <p className="comparison-explanation">{explanation}</p>
            </>
          ) : (
            <div className="comparison-empty">
              <span className="comparison-empty-icon">
                <Gauge size={23} aria-hidden="true" />
              </span>
              <p>{explanation}</p>
              <div className="comparison-hint-grid">
                <span>
                  <strong>{nodes.length}</strong>
                  selected locations
                </span>
                <span>
                  <strong className="mono">{totalSteps.toLocaleString('en-IN')}</strong>
                  total comparisons
                </span>
                <span>
                  <strong className="mono">O(V³)</strong>
                  cubic time
                </span>
              </div>
            </div>
          )}

          {complete && (
            <div className="comparison-complete">
              <CircleCheck size={17} aria-hidden="true" />
              <p>
                All {totalSteps.toLocaleString('en-IN')} k, i, j comparisons are
                complete. Every finite matrix entry is now an all-pairs shortest
                distance.
              </p>
            </div>
          )}

          {trace.negativeCycle && (
            <div className="comparison-cycle">
              <Info size={16} aria-hidden="true" />
              <span>
                A negative-weight cycle was detected. The matrix contains negative
                diagonal values, so shortest paths are not well-defined.
              </span>
            </div>
          )}

          <div className="recent-updates">
            <div className="recent-updates-head">
              <span>Recent improvements</span>
              <span className="mono">{player.updates} so far</span>
            </div>
            {recentUpdates.length === 0 ? (
              <p className="recent-empty">No distance improvements yet.</p>
            ) : (
              <ul>
                {recentUpdates.map((record) => {
                  const source = nodes[record.i]
                  const target = nodes[record.j]
                  return (
                    <li key={record.step}>
                      <span className="recent-update-cell mono">
                        {source?.shortName} → {target?.shortName}
                      </span>
                      <span className="recent-update-values mono">
                        {Number.isFinite(record.previousDistance)
                          ? Math.round(record.previousDistance)
                          : '∞'}{' '}
                        → {Math.round(record.newDistance)} m
                      </span>
                      <small>via {nodes[record.k]?.shortName}</small>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <div className="viz-recurrence-mini">
            <span className="eyebrow-small">Recurrence</span>
            <code>
              D<sup>k</sup>[i][j] = min(D<sup>k−1</sup>[i][j], D<sup>k−1</sup>[i][k] +
              D<sup>k−1</sup>[k][j])
            </code>
          </div>
        </aside>
      </div>

      {allScope && !complete && (
        <div className="all-scope-note">
          <Info size={16} aria-hidden="true" />
          <span>
            Full-campus mode contains{' '}
            <strong className="mono">{totalSteps.toLocaleString('en-IN')}</strong>{' '}
            comparisons (38³). Stepping through all of them takes time; use{' '}
            <strong>Run Complete Algorithm</strong> for the final 38 × 38 matrix, or
            switch to a focused demo to study individual updates.
          </span>
        </div>
      )}

      <div className="viz-route-context">
        <span>
          <Gauge size={14} aria-hidden="true" />
          Selected graph: {nodes.length} vertices ·{' '}
          {campusEdges.filter(
            (edge) =>
              nodes.some((node) => node.id === edge.from) &&
              nodes.some((node) => node.id === edge.to),
          ).length}{' '}
          induced edges
        </span>
        <span>Each selected location appears once in the matrix and in the recurrence.</span>
      </div>
    </div>
  )
}

export function AlgorithmVisualizer() {
  const [mode, setMode] = useState<ScopeMode>('focused')
  const [focusedIds, setFocusedIds] = useState<string[]>(DEFAULT_FOCUSED_IDS)
  const [pickerOpen, setPickerOpen] = useState(false)

  const scopeIds = useMemo(() => {
    if (mode === 'all') return campusNodes.map((node) => node.id)
    const selected = new Set(focusedIds)
    return campusNodes.filter((node) => selected.has(node.id)).map((node) => node.id)
  }, [focusedIds, mode])

  const scopeNodes = useMemo(
    () =>
      scopeIds
        .map((id) => campusNodeById.get(id))
        .filter((node): node is CampusNode => Boolean(node)),
    [scopeIds],
  )

  const scopeKey = `${mode}:${scopeIds.join('|')}`
  const trace = useMemo(
    () => traceFloydWarshall(scopeIds, campusEdges),
    [scopeIds],
  )

  const toggleNode = (nodeId: string) => {
    setFocusedIds((current) => {
      if (current.includes(nodeId)) {
        if (current.length <= MIN_FOCUSED) return current
        return current.filter((id) => id !== nodeId)
      }
      if (current.length >= MAX_FOCUSED) return current
      const selected = new Set([...current, nodeId])
      return campusNodes.filter((node) => selected.has(node.id)).map((node) => node.id)
    })
  }

  const resetFocusedSelection = () => {
    setFocusedIds(DEFAULT_FOCUSED_IDS)
  }

  return (
    <section className="algorithm-visualizer" aria-labelledby="visualizer-title">
      <div className="viz-section-head">
        <div>
          <span className="eyebrow">Interactive execution</span>
          <h2 id="visualizer-title">Step through the matrix.</h2>
        </div>
        <p>
          Each step evaluates one <span className="mono">k, i, j</span> triple. Amber
          marks the comparison, green marks an improved distance.
        </p>
      </div>

      <div className="scope-card">
        <div className="scope-card-head">
          <div>
            <span className="eyebrow-small">Demo scope</span>
            <h3>
              {scopeNodes.length} locations selected
              <span className="scope-mono mono">
                {scopeNodes.length}³ ={' '}
                {(scopeNodes.length ** 3).toLocaleString('en-IN')} comparisons
              </span>
            </h3>
          </div>
          <div className="scope-mode-switch" role="group" aria-label="Algorithm demo scope">
            <button
              type="button"
              className={mode === 'focused' ? 'active' : ''}
              onClick={() => setMode('focused')}
              aria-pressed={mode === 'focused'}
            >
              Focused demo
              <span>{focusedIds.length}</span>
            </button>
            <button
              type="button"
              className={mode === 'all' ? 'active' : ''}
              onClick={() => {
                setMode('all')
                setPickerOpen(false)
              }}
              aria-pressed={mode === 'all'}
            >
              All {campusNodes.length} locations
            </button>
          </div>
        </div>

        <div className="scope-selected-row">
          <div className="scope-chips">
            {mode === 'all' ? (
              <span className="scope-all-chip">
                <Sparkles size={13} aria-hidden="true" />
                Full campus graph · V = {campusNodes.length}
              </span>
            ) : (
              scopeNodes.map((node) => {
                const category = categoryById.get(node.category)
                return (
                  <span
                    key={node.id}
                    className="scope-node-chip"
                    style={
                      {
                        '--scope-color': category?.color,
                        '--scope-tint': category?.tint,
                      } as CSSProperties
                    }
                  >
                    <CampusLocationIcon icon={node.icon} size={13} />
                    {node.shortName}
                    <span>{node.name}</span>
                  </span>
                )
              })
            )}
          </div>
          {mode === 'focused' && (
            <button
              type="button"
              className="scope-customize-button"
              onClick={() => setPickerOpen((open) => !open)}
              aria-expanded={pickerOpen}
              aria-controls="scope-picker"
            >
              {pickerOpen ? 'Close selection' : 'Customize'}
              <ChevronDown
                size={15}
                aria-hidden="true"
                style={{ transform: pickerOpen ? 'rotate(180deg)' : undefined }}
              />
            </button>
          )}
        </div>

        {mode === 'focused' && pickerOpen && (
          <div className="scope-picker" id="scope-picker">
            <div className="scope-picker-head">
              <div>
                <strong>Choose 2–10 locations for a focused demonstration</strong>
                <span>
                  Selected {focusedIds.length} of {MAX_FOCUSED}. Change the scope to
                  compare a smaller induced graph.
                </span>
              </div>
              <button type="button" className="text-button" onClick={resetFocusedSelection}>
                <RotateCcw size={13} aria-hidden="true" />
                Restore recommended set
              </button>
            </div>
            <div className="scope-picker-groups">
              {CATEGORIES.map((category) => {
                const categoryNodes = campusNodes.filter(
                  (node) => node.category === category.id,
                )
                return (
                  <fieldset className="scope-picker-group" key={category.id}>
                    <legend>
                      <CategoryIcon category={category.id} size={13} />
                      {category.shortLabel}
                    </legend>
                    <div>
                      {categoryNodes.map((node) => {
                        const selected = focusedIds.includes(node.id)
                        const atMax = focusedIds.length >= MAX_FOCUSED
                        const atMin = focusedIds.length <= MIN_FOCUSED
                        return (
                          <label
                            key={node.id}
                            className={`scope-checkbox${selected ? ' is-selected' : ''}${
                              (atMax && !selected) || (atMin && selected)
                                ? ' is-disabled'
                                : ''
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selected}
                              disabled={(atMax && !selected) || (atMin && selected)}
                              onChange={() => toggleNode(node.id)}
                            />
                            <span className="scope-checkmark" aria-hidden="true">
                              {selected && <Check size={11} />}
                            </span>
                            <span>
                              {node.name}
                              <small>{node.shortName}</small>
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </fieldset>
                )
              })}
            </div>
            <p className="scope-picker-note">
              The visualizer builds an induced graph from these locations and the campus
              edges that connect them. Disconnected pairs correctly remain ∞.
            </p>
          </div>
        )}

        {mode === 'all' && (
          <div className="scope-full-note">
            <Info size={15} aria-hidden="true" />
            <span>
              Full-campus mode: all {campusNodes.length} locations and all{' '}
              {campusEdges.length} edges. This produces{' '}
              {(campusNodes.length ** 3).toLocaleString('en-IN')} comparisons and a 38 ×
              38 matrix.
            </span>
          </div>
        )}
      </div>

      <MatrixPlayer key={scopeKey} trace={trace} nodes={scopeNodes} allScope={mode === 'all'} />
    </section>
  )
}
