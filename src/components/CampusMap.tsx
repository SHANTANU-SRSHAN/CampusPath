import {
  ArrowRight,
  ArrowUpRight,
  Compass,
  LocateFixed,
  Maximize2,
  Minus,
  Move,
  Navigation,
  Plus,
  RotateCcw,
  Route,
  Ruler,
  Search,
  X,
} from 'lucide-react'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useRoute } from '../context/RouteContext'
import {
  CAMPUS_MAP_HEIGHT,
  CAMPUS_MAP_WIDTH,
  CATEGORIES,
  campusEdges,
  campusNodeById,
  campusNodes,
  categoryById,
  getNeighbors,
  type CampusEdge,
  type CampusNode,
  type CategoryId,
} from '../data/campusGraph'
import { formatDistance, formatWalkTimeShort } from '../lib/format'
import { CategoryIcon, CampusLocationIcon } from './CampusIcon'

type PositionMap = Record<string, { x: number; y: number }>

const MIN_ZOOM = 0.75
const MAX_ZOOM = 2.8
const MAP_CENTER = { x: CAMPUS_MAP_WIDTH / 2, y: CAMPUS_MAP_HEIGHT / 2 }

const initialPositions: PositionMap = Object.fromEntries(
  campusNodes.map((node) => [node.id, { x: node.x, y: node.y }]),
)

const nodeIndex = new Map(campusNodes.map((node, index) => [node.id, index]))

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function edgeKey(from: string, to: string) {
  return [from, to].sort().join('::')
}

function wrapLabel(name: string, maxCharacters = 18): string[] {
  const words = name.split(' ')
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (candidate.length > maxCharacters && current) {
      lines.push(current)
      current = word
    } else {
      current = candidate
    }
  }
  if (current) lines.push(current)
  return lines
}

function distanceLabelPosition(
  edge: CampusEdge,
  positions: PositionMap,
): { x: number; y: number } {
  const from = positions[edge.from] ?? { x: 0, y: 0 }
  const to = positions[edge.to] ?? { x: 0, y: 0 }
  const dx = to.x - from.x
  const dy = to.y - from.y
  const length = Math.max(1, Math.hypot(dx, dy))
  const normalX = -dy / length
  const normalY = dx / length
  const parity = nodeIndex.get(edge.from)! % 2 === 0 ? 1 : -1
  const offset = parity * (length < 105 ? 8 : 11)
  return {
    x: (from.x + to.x) / 2 + normalX * offset,
    y: (from.y + to.y) / 2 + normalY * offset,
  }
}

interface NodeDragState {
  id: string
  offsetX: number
  offsetY: number
  startClientX: number
  startClientY: number
  moved: boolean
}

interface PanState {
  startX: number
  startY: number
  originX: number
  originY: number
  moved: boolean
}

export function CampusMap() {
  const {
    allPairs,
    result,
    clearResult,
    setSourceId,
    setDestinationId,
  } = useRoute()
  const navigate = useNavigate()
  const svgRef = useRef<SVGSVGElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const nodeDragRef = useRef<NodeDragState | null>(null)
  const panRef = useRef<PanState | null>(null)

  const [positions, setPositions] = useState<PositionMap>(initialPositions)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<'all' | CategoryId>('all')
  const [showDistances, setShowDistances] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)

  const selectedNode = selectedNodeId ? campusNodeById.get(selectedNodeId) ?? null : null
  const focusNodeId = selectedNodeId ?? hoveredNodeId
  const neighbors = useMemo(
    () => (focusNodeId ? getNeighbors(focusNodeId) : []),
    [focusNodeId],
  )

  const routeActive = Boolean(
    result &&
      (result.status === 'found' || result.status === 'same-location') &&
      result.path.length > 0,
  )
  const routeNodeIds = useMemo(
    () => new Set(routeActive && result ? result.path.map((node) => node.id) : []),
    [result, routeActive],
  )
  const routeEdgeKeys = useMemo(
    () =>
      new Set(
        routeActive && result
          ? result.segments.map((segment) => edgeKey(segment.fromId, segment.toId))
          : [],
      ),
    [result, routeActive],
  )

  const focusNeighborhoodIds = useMemo(() => {
    const ids = new Set<string>()
    if (!focusNodeId) return ids
    ids.add(focusNodeId)
    for (const neighbor of neighbors) ids.add(neighbor.node.id)
    return ids
  }, [focusNodeId, neighbors])

  const neighborEdgeKeys = useMemo(() => {
    if (!focusNodeId) return new Set<string>()
    return new Set(neighbors.map((neighbor) => edgeKey(focusNodeId, neighbor.node.id)))
  }, [focusNodeId, neighbors])

  const searchResults = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return []
    return campusNodes
      .filter(
        (node) =>
          node.name.toLowerCase().includes(term) ||
          node.shortName.toLowerCase().includes(term) ||
          (categoryById.get(node.category)?.label.toLowerCase().includes(term) ?? false),
      )
      .slice(0, 7)
  }, [searchTerm])

  useEffect(() => {
    if (!searchFocused) return
    const handleOutside = (event: PointerEvent) => {
      if (!searchRef.current?.contains(event.target as Node)) {
        setSearchFocused(false)
      }
    }
    document.addEventListener('pointerdown', handleOutside)
    return () => document.removeEventListener('pointerdown', handleOutside)
  }, [searchFocused])

  useEffect(() => {
    setIsPanning(false)
    setDraggingNodeId(null)
  }, [categoryFilter])

  const clientToSvg = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const point = svg.createSVGPoint()
    point.x = clientX
    point.y = clientY
    const matrix = svg.getScreenCTM()
    if (!matrix) return { x: 0, y: 0 }
    const transformed = point.matrixTransform(matrix.inverse())
    return { x: transformed.x, y: transformed.y }
  }, [])

  const zoomTo = useCallback(
    (nextZoom: number, anchor = MAP_CENTER) => {
      const bounded = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM)
      const mapX = (anchor.x - pan.x) / zoom
      const mapY = (anchor.y - pan.y) / zoom
      setPan({
        x: anchor.x - mapX * bounded,
        y: anchor.y - mapY * bounded,
      })
      setZoom(bounded)
    },
    [pan.x, pan.y, zoom],
  )

  const focusOnNode = useCallback(
    (node: CampusNode, nextZoom = Math.max(zoom, 1.35)) => {
      const bounded = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM)
      setZoom(bounded)
      setPan({
        x: MAP_CENTER.x - (positions[node.id]?.x ?? node.x) * bounded,
        y: MAP_CENTER.y - (positions[node.id]?.y ?? node.y) * bounded,
      })
      setSelectedNodeId(node.id)
    },
    [positions, zoom],
  )

  const resetLayout = () => {
    setPositions(initialPositions)
    setZoom(1)
    setPan({ x: 0, y: 0 })
    setSelectedNodeId(null)
    setHoveredNodeId(null)
    setCategoryFilter('all')
    setSearchTerm('')
    setSearchFocused(false)
    setShowDistances(true)
  }

  const handleWheel = (event: ReactWheelEvent<SVGSVGElement>) => {
    event.preventDefault()
    const root = clientToSvg(event.clientX, event.clientY)
    const factor = event.deltaY < 0 ? 1.12 : 0.89
    const nextZoom = clamp(zoom * factor, MIN_ZOOM, MAX_ZOOM)
    const mapX = (root.x - pan.x) / zoom
    const mapY = (root.y - pan.y) / zoom
    setZoom(nextZoom)
    setPan({
      x: root.x - mapX * nextZoom,
      y: root.y - mapY * nextZoom,
    })
  }

  const handleSvgPointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (event.button !== 0) return
    if ((event.target as Element).closest('[data-map-node]')) return
    const root = clientToSvg(event.clientX, event.clientY)
    panRef.current = {
      startX: root.x,
      startY: root.y,
      originX: pan.x,
      originY: pan.y,
      moved: false,
    }
    setIsPanning(true)
    svgRef.current?.setPointerCapture(event.pointerId)
  }

  const handleNodePointerDown = (
    event: ReactPointerEvent<SVGGElement>,
    node: CampusNode,
  ) => {
    if (event.button !== 0) return
    event.stopPropagation()
    const root = clientToSvg(event.clientX, event.clientY)
    const position = positions[node.id] ?? { x: node.x, y: node.y }
    const mapX = (root.x - pan.x) / zoom
    const mapY = (root.y - pan.y) / zoom
    nodeDragRef.current = {
      id: node.id,
      offsetX: position.x - mapX,
      offsetY: position.y - mapY,
      startClientX: event.clientX,
      startClientY: event.clientY,
      moved: false,
    }
    setDraggingNodeId(node.id)
    svgRef.current?.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    const drag = nodeDragRef.current
    if (drag) {
      const distance = Math.hypot(
        event.clientX - drag.startClientX,
        event.clientY - drag.startClientY,
      )
      if (distance > 3) drag.moved = true
      if (drag.moved) {
        const root = clientToSvg(event.clientX, event.clientY)
        const mapX = (root.x - pan.x) / zoom
        const mapY = (root.y - pan.y) / zoom
        setPositions((current) => ({
          ...current,
          [drag.id]: {
            x: clamp(mapX + drag.offsetX, 38, CAMPUS_MAP_WIDTH - 38),
            y: clamp(mapY + drag.offsetY, 38, CAMPUS_MAP_HEIGHT - 28),
          },
        }))
      }
      return
    }

    const panState = panRef.current
    if (panState) {
      const root = clientToSvg(event.clientX, event.clientY)
      const dx = root.x - panState.startX
      const dy = root.y - panState.startY
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) panState.moved = true
      if (panState.moved) {
        setPan({
          x: panState.originX + dx,
          y: panState.originY + dy,
        })
      }
    }
  }

  const handlePointerUp = (event: ReactPointerEvent<SVGSVGElement>) => {
    const drag = nodeDragRef.current
    if (drag) {
      if (!drag.moved) setSelectedNodeId(drag.id)
      nodeDragRef.current = null
      setDraggingNodeId(null)
    } else if (panRef.current) {
      const wasClick = !panRef.current.moved
      panRef.current = null
      setIsPanning(false)
      if (wasClick) setSelectedNodeId(null)
    }
    if (svgRef.current?.hasPointerCapture(event.pointerId)) {
      svgRef.current.releasePointerCapture(event.pointerId)
    }
  }

  const handleNodeKeyDown = (
    event: KeyboardEvent<SVGGElement>,
    node: CampusNode,
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setSelectedNodeId(node.id)
    }
  }

  const selectSearchResult = (node: CampusNode) => {
    if (categoryFilter !== 'all' && node.category !== categoryFilter) {
      setCategoryFilter('all')
    }
    setSearchTerm(node.name)
    setSearchFocused(false)
    focusOnNode(node)
  }

  const categoryCounts = useMemo(() => {
    const counts = new Map<CategoryId, number>()
    for (const node of campusNodes) {
      counts.set(node.category, (counts.get(node.category) ?? 0) + 1)
    }
    return counts
  }, [])

  const routeDistance = result?.distance ?? 0
  const routeWalkSpeed = result?.walkingSpeed ?? 1.3

  return (
    <div className="map-page">
      <section className="page-intro container">
        <div>
          <span className="eyebrow">Campus graph · interactive map</span>
          <h1>Every corner of campus, on one canvas.</h1>
        </div>
        <p>
          Explore the same weighted graph that powers the shortest-path calculations.
          Zoom, pan, drag locations, or isolate a category to study the network.
        </p>
      </section>

      <div className="container map-workbench">
        <div className="map-toolbar">
          <div className="map-search" ref={searchRef}>
            <Search size={17} aria-hidden="true" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value)
                setSearchFocused(true)
              }}
              onFocus={() => setSearchFocused(true)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && searchResults[0]) {
                  event.preventDefault()
                  selectSearchResult(searchResults[0])
                }
                if (event.key === 'Escape') {
                  setSearchTerm('')
                  setSearchFocused(false)
                }
              }}
              placeholder="Search a building, lab, or gate…"
              aria-label="Search campus locations"
              aria-expanded={searchFocused && Boolean(searchTerm)}
              aria-controls="map-search-results"
              role="combobox"
              autoComplete="off"
            />
            {searchTerm && (
              <button
                type="button"
                className="map-search-clear"
                aria-label="Clear search"
                onClick={() => {
                  setSearchTerm('')
                  setSearchFocused(false)
                }}
              >
                <X size={14} aria-hidden="true" />
              </button>
            )}
            {searchFocused && searchTerm && (
              <div className="map-search-popover" id="map-search-results" role="listbox">
                <div className="map-search-heading">
                  <span>Search results</span>
                  <span>{searchResults.length}</span>
                </div>
                {searchResults.length === 0 ? (
                  <p className="map-search-empty">
                    No location matches “{searchTerm}”.
                  </p>
                ) : (
                  searchResults.map((node) => {
                    const category = categoryById.get(node.category)
                    return (
                      <button
                        key={node.id}
                        type="button"
                        role="option"
                        aria-selected={node.id === selectedNodeId}
                        className="map-search-result"
                        onPointerDown={(event) => {
                          event.preventDefault()
                          selectSearchResult(node)
                        }}
                      >
                        <span
                          className="map-search-result-icon"
                          style={{
                            color: category?.color,
                            backgroundColor: category?.tint,
                          }}
                        >
                          <CampusLocationIcon icon={node.icon} size={15} />
                        </span>
                        <span>
                          <strong>{node.name}</strong>
                          <small>{category?.shortLabel}</small>
                        </span>
                        <LocateFixed size={14} aria-hidden="true" />
                      </button>
                    )
                  })
                )}
              </div>
            )}
          </div>

          <div className="map-toolbar-actions">
            <button
              type="button"
              className={`toolbar-toggle${showDistances ? ' is-active' : ''}`}
              onClick={() => setShowDistances((visible) => !visible)}
              aria-pressed={showDistances}
            >
              <Ruler size={16} aria-hidden="true" />
              <span>Distances</span>
              <span className={`toggle-pill${showDistances ? ' on' : ''}`} aria-hidden="true">
                <span />
              </span>
            </button>
            <button type="button" className="toolbar-button" onClick={resetLayout}>
              <RotateCcw size={16} aria-hidden="true" />
              Reset layout
            </button>
          </div>
        </div>

        <div className="map-filter-row" aria-label="Filter locations by category">
          <span className="filter-label">Filter</span>
          <button
            type="button"
            className={`filter-chip${categoryFilter === 'all' ? ' active' : ''}`}
            onClick={() => setCategoryFilter('all')}
            aria-pressed={categoryFilter === 'all'}
          >
            All locations
            <span>{campusNodes.length}</span>
          </button>
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              type="button"
              className={`filter-chip${categoryFilter === category.id ? ' active' : ''}`}
              onClick={() => setCategoryFilter(category.id)}
              aria-pressed={categoryFilter === category.id}
              style={
                {
                  '--chip-color': category.color,
                  '--chip-tint': category.tint,
                } as CSSProperties
              }
            >
              <CategoryIcon category={category.id} size={14} />
              {category.shortLabel}
              <span>{categoryCounts.get(category.id) ?? 0}</span>
            </button>
          ))}
        </div>

        {routeActive && result && (
          <div className="map-route-banner">
            <span className="map-route-icon">
              <Route size={18} aria-hidden="true" />
            </span>
            <div className="map-route-banner-copy">
              <span className="eyebrow-small">Shortest route highlighted</span>
              <p>
                {result.from.name}
                <ArrowRight size={12} aria-hidden="true" />
                {result.to.name}
              </p>
            </div>
            <span className="map-route-metric">
              <strong>{formatDistance(routeDistance)}</strong>
              <small>≈ {formatWalkTimeShort(routeDistance / routeWalkSpeed)} walk</small>
            </span>
            <Link to="/find-path" className="map-route-link">
              Route details
              <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
            <button
              type="button"
              className="map-route-reset"
              onClick={clearResult}
            >
              <X size={14} aria-hidden="true" />
              Reset highlighting
            </button>
          </div>
        )}

        <div className="map-stage">
          <div className="map-shell">
            <div className="map-status-strip">
              <span>
                <span className="map-live-dot" aria-hidden="true" />
                {campusNodes.length} locations · {campusEdges.length} connections
              </span>
              <span className="map-status-filter">
                {categoryFilter === 'all'
                  ? 'Showing all categories'
                  : `Filtered: ${
                      categoryById.get(categoryFilter)?.shortLabel ?? 'category'
                    }`}
              </span>
            </div>

            <div className="campus-svg-wrap">
              <svg
                ref={svgRef}
                className={`campus-map-svg${isPanning ? ' is-panning' : ''}`}
                viewBox={`0 0 ${CAMPUS_MAP_WIDTH} ${CAMPUS_MAP_HEIGHT}`}
                onWheel={handleWheel}
                onPointerDown={handleSvgPointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                role="application"
                aria-label="Interactive campus graph. Use the location search or tab through locations to inspect them."
              >
                <defs>
                  <pattern
                    id="mapGrid"
                    width="32"
                    height="32"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 32 0 L 0 0 0 32"
                      fill="none"
                      stroke="#CABFAF"
                      strokeWidth="0.5"
                      opacity="0.2"
                    />
                  </pattern>
                  <filter id="mapNodeShadow" x="-40%" y="-40%" width="180%" height="180%">
                    <feDropShadow
                      dx="0"
                      dy="2"
                      stdDeviation="2.3"
                      floodColor="#4B3F2F"
                      floodOpacity="0.13"
                    />
                  </filter>
                  <filter id="pathGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                <rect width={CAMPUS_MAP_WIDTH} height={CAMPUS_MAP_HEIGHT} fill="#F7F2E9" />
                <rect
                  width={CAMPUS_MAP_WIDTH}
                  height={CAMPUS_MAP_HEIGHT}
                  fill="url(#mapGrid)"
                />

                <g className="map-zones" aria-hidden="true">
                  <rect x="48" y="34" width="552" height="366" rx="52" className="map-zone zone-hostels" />
                  <rect x="785" y="34" width="450" height="381" rx="56" className="map-zone zone-sports" />
                  <rect x="315" y="260" width="540" height="300" rx="52" className="map-zone zone-central" />
                  <rect x="300" y="450" width="955" height="394" rx="58" className="map-zone zone-academic" />
                  <text x="84" y="74" className="map-zone-text">
                    NORTH RESIDENTIAL
                  </text>
                  <text x="820" y="74" className="map-zone-text">
                    SPORTS & RECREATION
                  </text>
                  <text x="1140" y="426" textAnchor="end" className="map-zone-text">
                    ACADEMIC QUARTER
                  </text>
                  <text x="350" y="512" className="map-zone-text">
                    CENTRAL GREEN
                  </text>
                </g>

                <path
                  d="M28 690 C210 652 335 580 480 598 S790 690 960 610 S1198 590 1248 500"
                  className="map-avenue"
                  aria-hidden="true"
                />
                <path
                  d="M190 20 C210 190 280 330 330 470 S390 720 380 862"
                  className="map-avenue"
                  aria-hidden="true"
                />
                <path
                  d="M94 26 C92 116 76 178 70 856"
                  className="map-campus-boundary"
                  aria-hidden="true"
                />

                <g className="map-compass" transform="translate(1195 90)" aria-hidden="true">
                  <circle r="27" fill="#F6F0E5" stroke="#D8CDBE" />
                  <path d="M0 -18L5.5 6L0 2.5L-5.5 6Z" fill="#26a69a" />
                  <path d="M0 18L-4 0L0 3L4 0Z" fill="#C7BCAA" />
                  <text x="0" y="-33" textAnchor="middle">
                    N
                  </text>
                </g>

                <g className="map-decorations" aria-hidden="true">
                  <circle cx="720" cy="180" r="21" className="map-tree" />
                  <circle cx="750" cy="195" r="13" className="map-tree" />
                  <circle cx="612" cy="670" r="17" className="map-tree" />
                  <circle cx="1010" cy="327" r="14" className="map-tree" />
                  <circle cx="255" cy="445" r="16" className="map-tree" />
                  <circle cx="500" cy="445" r="12" className="map-tree" />
                  <path d="M690 210 H930" className="map-footpath" />
                  <path d="M1000 232 H1110" className="map-footpath" />
                  <text x="1224" y="870" textAnchor="end" className="map-scale-label">
                    SAMPLE LAYOUT · NOT TO SCALE
                  </text>
                </g>

                <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
                  <g className="map-edges">
                    {campusEdges.map((edge) => {
                      const from = positions[edge.from]
                      const to = positions[edge.to]
                      if (!from || !to) return null
                      const key = edgeKey(edge.from, edge.to)
                      const isRouteEdge = routeEdgeKeys.has(key)
                      const isNeighborEdge = neighborEdgeKeys.has(key)
                      const fromNode = campusNodeById.get(edge.from)
                      const toNode = campusNodeById.get(edge.to)
                      if (!fromNode || !toNode) return null

                      const categoryMuted =
                        categoryFilter !== 'all' &&
                        fromNode.category !== categoryFilter &&
                        toNode.category !== categoryFilter
                      const routeMuted =
                        routeActive &&
                        !isRouteEdge &&
                        !isNeighborEdge &&
                        !routeNodeIds.has(edge.from) &&
                        !routeNodeIds.has(edge.to)
                      const focusMuted =
                        !routeActive &&
                        focusNodeId &&
                        !isNeighborEdge &&
                        !focusNeighborhoodIds.has(edge.from) &&
                        !focusNeighborhoodIds.has(edge.to)
                      const muted = categoryMuted || routeMuted || focusMuted

                      return (
                        <line
                          key={key}
                          x1={from.x}
                          y1={from.y}
                          x2={to.x}
                          y2={to.y}
                          className={[
                            'map-edge',
                            isRouteEdge ? 'is-route' : '',
                            isNeighborEdge ? 'is-neighbor' : '',
                            muted ? 'is-muted' : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                        />
                      )
                    })}
                  </g>

                  <g className="map-distance-labels">
                    {campusEdges.map((edge) => {
                      const from = positions[edge.from]
                      const to = positions[edge.to]
                      if (!from || !to) return null
                      const key = edgeKey(edge.from, edge.to)
                      const isRouteEdge = routeEdgeKeys.has(key)
                      const isNeighborEdge = neighborEdgeKeys.has(key)
                      const shouldShow =
                        showDistances || isRouteEdge || isNeighborEdge
                      if (!shouldShow) return null
                      const labelPosition = distanceLabelPosition(edge, positions)
                      const fromNode = campusNodeById.get(edge.from)
                      const toNode = campusNodeById.get(edge.to)
                      if (!fromNode || !toNode) return null
                      const categoryMuted =
                        categoryFilter !== 'all' &&
                        fromNode.category !== categoryFilter &&
                        toNode.category !== categoryFilter
                      const muted =
                        categoryMuted ||
                        (routeActive && !isRouteEdge && !isNeighborEdge)

                      return (
                        <g
                          key={key}
                          transform={`translate(${labelPosition.x} ${labelPosition.y})`}
                          className={[
                            'map-distance-label',
                            isRouteEdge ? 'is-route' : '',
                            isNeighborEdge ? 'is-neighbor' : '',
                            muted ? 'is-muted' : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                        >
                          <rect x="-23" y="-8" width="46" height="16" rx="8" />
                          <text y="3.5" textAnchor="middle">
                            {edge.distance} m
                          </text>
                        </g>
                      )
                    })}
                  </g>

                  <g className="map-nodes">
                    {campusNodes.map((node) => {
                      const position = positions[node.id]
                      if (!position) return null
                      const category = categoryById.get(node.category)
                      const isSelected = node.id === selectedNodeId
                      const isFocused = node.id === focusNodeId
                      const isNeighbor = neighbors.some(
                        (neighbor) => neighbor.node.id === node.id,
                      )
                      const isRouteNode = routeNodeIds.has(node.id)
                      const isStart =
                        routeActive && result?.from.id === node.id
                      const isEnd = routeActive && result?.to.id === node.id
                      const categoryMuted =
                        categoryFilter !== 'all' &&
                        node.category !== categoryFilter &&
                        !isRouteNode &&
                        !isFocused &&
                        !isNeighbor
                      const routeMuted =
                        routeActive &&
                        !isRouteNode &&
                        !isFocused &&
                        !isNeighbor
                      const focusMuted =
                        !routeActive &&
                        focusNodeId &&
                        !isFocused &&
                        !isNeighbor
                      const muted = categoryMuted || routeMuted || focusMuted
                      const labelLines = wrapLabel(node.name)
                      const labelStartY = position.y + 37
                      const isDragging = draggingNodeId === node.id
                      const fill = isStart
                        ? '#26a69a'
                        : isEnd
                          ? '#D9A441'
                          : isRouteNode
                            ? '#EEF3EA'
                            : '#FFFEFB'

                      return (
                        <g
                          key={node.id}
                          data-map-node
                          role="button"
                          tabIndex={0}
                          aria-label={`${node.name}, ${category?.label}. ${
                            getNeighbors(node.id).length
                          } connections.`}
                          className={[
                            'map-node',
                            muted ? 'is-muted' : '',
                            isFocused ? 'is-focused' : '',
                            isSelected ? 'is-selected' : '',
                            isNeighbor ? 'is-neighbor' : '',
                            isStart ? 'is-start' : '',
                            isEnd ? 'is-end' : '',
                            isRouteNode ? 'is-route-node' : '',
                            isDragging ? 'is-dragging' : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          onPointerDown={(event) => handleNodePointerDown(event, node)}
                          onPointerEnter={() => setHoveredNodeId(node.id)}
                          onPointerLeave={() => setHoveredNodeId(null)}
                          onKeyDown={(event) => handleNodeKeyDown(event, node)}
                          onClick={(event) => {
                            if (nodeDragRef.current?.moved) {
                              event.preventDefault()
                            }
                          }}
                        >
                          {(isSelected || isFocused) && (
                            <circle
                              cx={position.x}
                              cy={position.y}
                              r="30"
                              className="map-node-focus-ring"
                            />
                          )}
                          {isStart && (
                            <>
                              <rect
                                x={position.x - 23}
                                y={position.y - 43}
                                width="46"
                                height="17"
                                rx="8.5"
                                className="map-node-role-pill start"
                              />
                              <text
                                x={position.x}
                                y={position.y - 31.5}
                                textAnchor="middle"
                                className="map-node-role-text"
                              >
                                START
                              </text>
                            </>
                          )}
                          {isEnd && (
                            <>
                              <rect
                                x={position.x - 23}
                                y={position.y - 43}
                                width="46"
                                height="17"
                                rx="8.5"
                                className="map-node-role-pill end"
                              />
                              <text
                                x={position.x}
                                y={position.y - 31.5}
                                textAnchor="middle"
                                className="map-node-role-text"
                              >
                                DEST
                              </text>
                            </>
                          )}
                          <circle
                            cx={position.x}
                            cy={position.y}
                            r={isRouteNode ? 23 : 21}
                            fill={fill}
                            stroke={
                              isSelected || isNeighbor
                                ? '#26a69a'
                                : isRouteNode
                                  ? '#26a69a'
                                  : category?.color ?? '#8A8277'
                            }
                            strokeWidth={isSelected || isRouteNode ? 2.4 : 1.5}
                            filter="url(#mapNodeShadow)"
                            className="map-node-circle"
                          />
                          <g
                            transform={`translate(${position.x - 9} ${position.y - 9})`}
                            className="map-node-icon"
                            style={{
                              color:
                                isStart || isEnd
                                  ? '#FFFDF7'
                                  : category?.color ?? '#5B5750',
                            }}
                          >
                            <CampusLocationIcon
                              icon={node.icon}
                              size={18}
                              strokeWidth={1.75}
                            />
                          </g>
                          <text
                            x={position.x}
                            y={labelStartY}
                            textAnchor="middle"
                            className="map-node-name"
                          >
                            {labelLines.map((line, lineIndex) => (
                              <tspan
                                key={line}
                                x={position.x}
                                dy={lineIndex === 0 ? 0 : 11.5}
                              >
                                {line}
                              </tspan>
                            ))}
                          </text>
                          {isNeighbor && (
                            <circle
                              cx={position.x + 17}
                              cy={position.y - 17}
                              r="4"
                              className="map-neighbor-dot"
                            />
                          )}
                        </g>
                      )
                    })}
                  </g>
                </g>
              </svg>

              <div className="map-zoom-controls" aria-label="Map zoom controls">
                <button
                  type="button"
                  aria-label="Zoom in"
                  onClick={() => zoomTo(zoom * 1.2)}
                  disabled={zoom >= MAX_ZOOM}
                >
                  <Plus size={16} aria-hidden="true" />
                </button>
                <span className="zoom-readout mono">{Math.round(zoom * 100)}%</span>
                <button
                  type="button"
                  aria-label="Zoom out"
                  onClick={() => zoomTo(zoom / 1.2)}
                  disabled={zoom <= MIN_ZOOM}
                >
                  <Minus size={16} aria-hidden="true" />
                </button>
                <span className="zoom-divider" aria-hidden="true" />
                <button
                  type="button"
                  aria-label="Fit campus map"
                  onClick={() => {
                    setZoom(1)
                    setPan({ x: 0, y: 0 })
                  }}
                >
                  <Maximize2 size={15} aria-hidden="true" />
                </button>
              </div>

              <div className="map-instruction-pill">
                <Move size={14} aria-hidden="true" />
                Drag to pan · drag a node to move it · scroll to zoom
              </div>

              <div className="map-compass-hint" aria-label="Campus map orientation">
                <Compass size={17} aria-hidden="true" />
                <span>N</span>
              </div>
            </div>
          </div>

          {selectedNode && (
            <aside className="map-detail-panel" aria-label={`${selectedNode.name} details`}>
              <div className="map-detail-top">
                <span
                  className="map-detail-category"
                  style={{
                    color: categoryById.get(selectedNode.category)?.color,
                    backgroundColor: categoryById.get(selectedNode.category)?.tint,
                  }}
                >
                  <CategoryIcon category={selectedNode.category} size={13} />
                  {categoryById.get(selectedNode.category)?.label}
                </span>
                <button
                  type="button"
                  className="icon-button"
                  aria-label="Close location details"
                  onClick={() => setSelectedNodeId(null)}
                >
                  <X size={17} aria-hidden="true" />
                </button>
              </div>
              <div className="map-detail-title">
                <span
                  className="map-detail-icon"
                  style={{
                    color: categoryById.get(selectedNode.category)?.color,
                    backgroundColor: categoryById.get(selectedNode.category)?.tint,
                  }}
                >
                  <CampusLocationIcon icon={selectedNode.icon} size={22} />
                </span>
                <div>
                  <span className="eyebrow-small">
                    Location {String(selectedNode.number).padStart(2, '0')} of{' '}
                    {campusNodes.length}
                  </span>
                  <h2>{selectedNode.name}</h2>
                </div>
              </div>
              <p className="map-detail-description">{selectedNode.description}</p>
              <div className="map-detail-meta">
                <span>
                  <Navigation size={13} aria-hidden="true" />
                  {getNeighbors(selectedNode.id).length} connections
                </span>
                <span className="mono">
                  x {Math.round(positions[selectedNode.id]?.x ?? selectedNode.x)} · y{' '}
                  {Math.round(positions[selectedNode.id]?.y ?? selectedNode.y)}
                </span>
              </div>

              <div className="map-detail-connections">
                <div className="map-detail-section-title">
                  <span>Connected locations</span>
                  <span>Walking distance</span>
                </div>
                <div className="map-detail-connection-list">
                  {getNeighbors(selectedNode.id).map((neighbor) => {
                    const category = categoryById.get(neighbor.node.category)
                    return (
                      <button
                        key={neighbor.node.id}
                        type="button"
                        className="map-connection-row"
                        onClick={() => focusOnNode(neighbor.node, Math.max(zoom, 1.35))}
                      >
                        <span
                          className="map-connection-icon"
                          style={{
                            color: category?.color,
                            backgroundColor: category?.tint,
                          }}
                        >
                          <CampusLocationIcon icon={neighbor.node.icon} size={14} />
                        </span>
                        <span>{neighbor.node.name}</span>
                        <strong>{neighbor.distance} m</strong>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="map-detail-actions">
                <button
                  type="button"
                  className="button button-primary button-small"
                  onClick={() => {
                    setSourceId(selectedNode.id)
                    navigate('/find-path')
                  }}
                >
                  Route from here
                  <ArrowRight size={14} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="button button-secondary button-small"
                  onClick={() => {
                    setDestinationId(selectedNode.id)
                    navigate('/find-path')
                  }}
                >
                  Route to here
                </button>
              </div>
              <p className="map-detail-tip">
                Connected neighbors are highlighted in olive. Distances beside each row are
                direct edge weights.
              </p>
            </aside>
          )}
        </div>

        <div className="map-footer-strip">
          <div className="map-legend" aria-label="Map legend">
            <span className="legend-title">Map key</span>
            {CATEGORIES.map((category) => (
              <span key={category.id} className="map-legend-item">
                <span
                  className="legend-dot"
                  style={{ backgroundColor: category.color }}
                  aria-hidden="true"
                />
                {category.shortLabel}
              </span>
            ))}
            <span className="map-legend-item">
              <span className="legend-line route" aria-hidden="true" />
              Shortest path
            </span>
          </div>
          <div className="map-graph-summary">
            <span>
              <span className="mono">V</span> {campusNodes.length}
            </span>
            <span>
              <span className="mono">E</span> {campusEdges.length}
            </span>
            <span className="graph-connected">
              <span className="status-dot" aria-hidden="true" />
              Connected graph
            </span>
            <span className="mono">
              {allPairs.dist.length} × {allPairs.dist.length} matrix
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
