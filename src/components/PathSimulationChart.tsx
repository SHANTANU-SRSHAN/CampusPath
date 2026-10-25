import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { ArrowRight, Flag, Pause, Play, RotateCcw, CheckCircle2 } from 'lucide-react'
import type { RouteResult } from '../context/RouteContext'
import { formatDistance, formatWalkTime } from '../lib/format'

interface PathSimulationChartProps {
  result: RouteResult
  walkingSpeed: number
}

const BASE_DURATION_MS = 8000
const TICK_MS = 50

const SPEED_OPTIONS = [
  { value: 0.5, label: '0.5×' },
  { value: 1, label: '1×' },
  { value: 2, label: '2×' },
]

const W = 640
const H = 264
const PAD = { top: 46, right: 26, bottom: 52, left: 52 }

export function PathSimulationChart({
  result,
  walkingSpeed,
}: PathSimulationChartProps) {
  const points = result.path
  const segments = result.segments
  const total = result.distance

  // Cumulative distance at each checkpoint.
  const cumulative = useMemo(() => {
    const values = [0]
    for (const segment of segments) {
      values.push(values[values.length - 1] + segment.distance)
    }
    return values
  }, [segments])

  const prefersReducedMotion = useRef(
    typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  const [progress, setProgress] = useState(() =>
    prefersReducedMotion.current ? 1 : 0,
  )
  const [playing, setPlaying] = useState(() => !prefersReducedMotion.current)
  const [speed, setSpeed] = useState(1)

  // Restart the simulation whenever a new route is calculated.
  useEffect(() => {
    if (prefersReducedMotion.current) {
      setProgress(1)
      setPlaying(false)
    } else {
      setProgress(0)
      setPlaying(true)
    }
  }, [result.from.id, result.to.id, points.length])

  // Playback loop.
  useEffect(() => {
    if (!playing) return
    const interval = window.setInterval(() => {
      setProgress((previous) => {
        const step = (TICK_MS / BASE_DURATION_MS) * speed
        const next = previous + step
        if (next >= 1) {
          window.clearInterval(interval)
          setPlaying(false)
          return 1
        }
        return next
      })
    }, TICK_MS)
    return () => window.clearInterval(interval)
  }, [playing, speed])

  const arrived = progress >= 1
  const covered = total * progress
  const remaining = Math.max(0, total - covered)
  const percent = Math.round(progress * 100)

  // Chart geometry helpers.
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom

  const xAt = (index: number) =>
    points.length === 1
      ? PAD.left
      : PAD.left + (index / (points.length - 1)) * innerW
  const yAt = (value: number) =>
    total === 0
      ? PAD.top + innerH
      : PAD.top + innerH - (value / total) * innerH

  const chartPoints = points.map((_, index) => ({
    x: xAt(index),
    y: yAt(cumulative[index]),
  }))

  // Interpolated walker position along the polyline.
  const walker = useMemo(() => {
    const target = total * progress
    let index = 0
    while (
      index < cumulative.length - 2 &&
      cumulative[index + 1] < target
    ) {
      index += 1
    }
    const startValue = cumulative[index]
    const endValue = cumulative[index + 1] ?? startValue
    const span = endValue - startValue
    const local = span === 0 ? 0 : (target - startValue) / span
    const a = chartPoints[index]
    const b = chartPoints[index + 1] ?? a
    return {
      x: a.x + (b.x - a.x) * local,
      y: a.y + (b.y - a.y) * local,
      checkpoint: target >= total ? points.length - 1 : index,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartPoints, cumulative, progress, total, points.length])

  // Solid portion of the route up to the walker.
  const drawnLine = useMemo(() => {
    if (chartPoints.length < 2) return ''
    const target = total * progress
    let index = 0
    while (index < cumulative.length - 2 && cumulative[index + 1] < target) {
      index += 1
    }
    const pointsToDraw = chartPoints.slice(0, index + 1).map((p) => p)
    const line =
      pointsToDraw.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`).join(' ') +
      ` L${walker.x} ${walker.y}`
    return line
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartPoints, cumulative, progress, total, walker])

  const drawnArea =
    chartPoints.length < 2
      ? ''
      : `${drawnLine} L${walker.x} ${PAD.top + innerH} L${PAD.left} ${
          PAD.top + innerH
        } Z`

  const fullLine = chartPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`)
    .join(' ')

  // Axis labels: show all short names when few, else a spread subset.
  const labelIndices = useMemo(() => {
    const n = points.length
    if (n <= 8) return points.map((_, i) => i)
    const count = 8
    const picked = new Set<number>()
    for (let i = 0; i < count; i += 1) {
      picked.add(Math.round((i / (count - 1)) * (n - 1)))
    }
    picked.add(0)
    picked.add(n - 1)
    return [...picked].sort((a, b) => a - b)
  }, [points])

  const currentCheckpointIndex = Math.min(
    points.length - 1,
    walker.checkpoint + (arrived ? 0 : 0),
  )
  const currentCheckpoint = points[currentCheckpointIndex]
  const maxSegment = Math.max(...segments.map((segment) => segment.distance), 1)

  const handleRestart = () => {
    setProgress(0)
    if (!prefersReducedMotion.current) setPlaying(true)
  }

  const handlePlayPause = () => {
    if (arrived) {
      handleRestart()
      return
    }
    setPlaying((wasPlaying) => !wasPlaying)
  }

  return (
    <section
      className="sim-chart"
      aria-label="Route simulation chart"
      aria-live="off"
    >
      <div className="sim-chart-head">
        <div>
          <span className="eyebrow-small">
            <Flag size={13} aria-hidden="true" />
            Route simulation
          </span>
          <h3>Walk the shortest path, metre by metre</h3>
        </div>
        <span className="sim-chart-total mono">
          {formatDistance(total)} · {points.length} checkpoints
        </span>
      </div>

      <div className="sim-stage" aria-hidden="true">
        <svg
          className="sim-chart-svg"
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`Simulation of the shortest route: cumulative distance grows from 0 to ${Math.round(
            total,
          )} metres across ${points.length} checkpoints.`}
        >
          <defs>
            <linearGradient id="simAreaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#26a69a" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#26a69a" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Horizontal gridlines + Y labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
            const value = total * fraction
            const y = yAt(value)
            return (
              <g key={fraction}>
                <line
                  className="sim-gridline"
                  x1={PAD.left}
                  y1={y}
                  x2={W - PAD.right}
                  y2={y}
                />
                <text className="sim-axis-label" x={PAD.left - 8} y={y + 3.5} textAnchor="end">
                  {Math.round(value)}
                </text>
              </g>
            )
          })}
          <text
            className="sim-axis-label"
            x={12}
            y={PAD.top + innerH / 2}
            textAnchor="middle"
            transform={`rotate(-90 12 ${PAD.top + innerH / 2})`}
          >
            metres
          </text>

          {/* Baseline */}
          <line
            className="sim-axis-line"
            x1={PAD.left}
            y1={PAD.top + innerH}
            x2={W - PAD.right}
            y2={PAD.top + innerH}
          />

          {/* Full route (dashed) then progress overlay */}
          <path className="sim-full-line" d={fullLine} />
          {progress > 0 && (
            <>
              <path className="sim-progress-area" d={drawnArea} />
              <path className="sim-progress-line" d={drawnLine} />
            </>
          )}

          {/* Checkpoints */}
          {chartPoints.map((point, index) => {
            const passed = cumulative[index] <= covered + 0.001
            const isFinal = index === points.length - 1
            return (
              <g key={points[index].id}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={isFinal || index === 0 ? 6 : 4.5}
                  fill={
                    index === 0
                      ? '#26a69a'
                      : isFinal
                        ? '#D9A441'
                        : passed
                          ? '#26a69a'
                          : '#FFFEFB'
                  }
                  stroke={passed || index === 0 || isFinal ? 'none' : '#B8AE9F'}
                  strokeWidth="1.6"
                />
                {labelIndices.includes(index) && (
                  <text
                    className={`sim-checkpoint-label${
                      index === points.length - 1 ? ' is-end' : ''
                    }`}
                    x={point.x}
                    y={PAD.top + innerH + 18}
                    textAnchor="end"
                    transform={`rotate(-38 ${point.x} ${PAD.top + innerH + 18})`}
                  >
                    {points[index].shortName}
                  </text>
                )}
              </g>
            )
          })}

          {/* Walker marker */}
          {progress > 0 && (
            <g>
              <circle className="sim-walker-ring" cx={walker.x} cy={walker.y} r={9} />
              <circle className="sim-walker" cx={walker.x} cy={walker.y} r={7} />
              <g
                transform={`translate(${Math.min(
                  Math.max(walker.x, PAD.left + 34),
                  W - PAD.right - 34,
                )} ${Math.max(walker.y - 26, 18)})`}
              >
                <rect className="sim-walker-chip-bg" x={-32} y={-12} width={64} height={19} />
                <text className="sim-walker-chip-text" y={1.5}>
                  {Math.round(covered)} m
                </text>
              </g>
            </g>
          )}
        </svg>
      </div>

      <div className="sim-progress-track" aria-hidden="true">
        <div className="sim-progress-fill" style={{ width: `${percent}%` }} />
      </div>

      <div className="sim-controls">
        <button
          type="button"
          className="sim-play-button"
          onClick={handlePlayPause}
          aria-label={arrived ? 'Replay simulation' : playing ? 'Pause simulation' : 'Play simulation'}
        >
          {arrived ? <RotateCcw size={15} aria-hidden="true" /> : playing ? <Pause size={15} aria-hidden="true" /> : <Play size={15} aria-hidden="true" />}
          {arrived ? 'Replay' : playing ? 'Pause' : 'Play'}
        </button>
        <button
          type="button"
          className="sim-restart-button"
          onClick={handleRestart}
          aria-label="Restart simulation"
        >
          <RotateCcw size={14} aria-hidden="true" />
          Restart
        </button>
        <div className="sim-speed-group" role="group" aria-label="Simulation speed">
          <span className="sim-speed-label">Speed</span>
          {SPEED_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`sim-speed-button${speed === option.value ? ' active' : ''}`}
              onClick={() => setSpeed(option.value)}
              aria-pressed={speed === option.value}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="sim-readout">
        <div className="sim-readout-item">
          <span className="sim-readout-label">Checkpoint</span>
          <span className="sim-readout-value">
            {currentCheckpoint?.shortName ?? '—'}
          </span>
        </div>
        <div className="sim-readout-item">
          <span className="sim-readout-label">Distance covered</span>
          <span className="sim-readout-value">{Math.round(covered)} m</span>
        </div>
        <div className="sim-readout-item">
          <span className="sim-readout-label">Remaining</span>
          <span className="sim-readout-value">{Math.round(remaining)} m</span>
        </div>
        <div className="sim-readout-item">
          <span className="sim-readout-label">{arrived ? 'Status' : 'Walk time'}</span>
          <span className={`sim-readout-value${arrived ? ' arrived' : ''}`}>
            {arrived ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={14} aria-hidden="true" /> Arrived
              </span>
            ) : (
              formatWalkTime(covered / walkingSpeed)
            )}
          </span>
        </div>
      </div>

      {segments.length > 0 && (
        <div className="sim-segments">
          <span className="sim-segments-title">Segment breakdown</span>
          {segments.map((segment, index) => {
            const from = points[index]
            const to = points[index + 1]
            const done = cumulative[index + 1] <= covered + 0.001
            return (
              <div className="sim-segment-row" key={`${segment.fromId}-${segment.toId}`}>
                <span className="sim-segment-name">
                  {from?.shortName}
                  <ArrowRight size={11} aria-hidden="true" />
                  {to?.shortName}
                </span>
                <span className="sim-segment-track">
                  <span
                    className={`sim-segment-fill${done ? ' done' : ''}`}
                    style={{ width: `${(segment.distance / maxSegment) * 100}%` }}
                  />
                </span>
                <span className="sim-segment-value">{segment.distance} m</span>
              </div>
            )
          })}
        </div>
      )}

      <p className="sim-note">
        Simulation playback at a constant pace — the curve plots cumulative distance
        after each checkpoint. Distances are sample values for the graph model.
      </p>
    </section>
  )
}
