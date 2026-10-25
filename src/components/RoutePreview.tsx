import { ArrowRight, MapPinned, Route } from 'lucide-react'
import {
  CAMPUS_MAP_HEIGHT,
  CAMPUS_MAP_WIDTH,
  campusEdges,
  campusNodeById,
  campusNodes,
  categoryById,
} from '../data/campusGraph'
import type { RouteResult } from '../context/RouteContext'
import { formatDistance } from '../lib/format'
import { CampusLocationIcon } from './CampusIcon'

interface RoutePreviewProps {
  result: RouteResult
}

function edgeKey(from: string, to: string) {
  return [from, to].sort().join('::')
}

export function RoutePreview({ result }: RoutePreviewProps) {
  const routeEdgeKeys = new Set(
    result.segments.map((segment) => edgeKey(segment.fromId, segment.toId)),
  )
  const routeNodeIds = new Set(result.path.map((node) => node.id))

  return (
    <div className="route-preview">
      <div className="route-preview-head">
        <div>
          <span className="eyebrow-small">
            <Route size={13} aria-hidden="true" />
            Route preview
          </span>
          <h3>One shortest path on the campus graph</h3>
        </div>
        <span className="route-preview-distance mono">
          {formatDistance(result.distance)}
        </span>
      </div>

      <div className="route-preview-canvas">
        <svg
          viewBox={`0 0 ${CAMPUS_MAP_WIDTH} ${CAMPUS_MAP_HEIGHT}`}
          role="img"
          aria-label={`Campus graph with the shortest route from ${result.from.name} to ${result.to.name} highlighted.`}
        >
          <defs>
            <pattern
              id="previewDots"
              width="26"
              height="26"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="1" cy="1" r="1" fill="#D8CEBE" opacity="0.45" />
            </pattern>
            <filter id="previewGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow
                dx="0"
                dy="2"
                stdDeviation="3"
                floodColor="#26a69a"
                floodOpacity="0.28"
              />
            </filter>
          </defs>

          <rect width={CAMPUS_MAP_WIDTH} height={CAMPUS_MAP_HEIGHT} fill="#F8F4EB" />
          <rect
            width={CAMPUS_MAP_WIDTH}
            height={CAMPUS_MAP_HEIGHT}
            fill="url(#previewDots)"
          />
          <rect
            x="42"
            y="34"
            width="1196"
            height="832"
            rx="62"
            fill="none"
            stroke="#D9CEBD"
            strokeWidth="1.2"
            strokeDasharray="5 7"
          />

          <g className="preview-base-edges">
            {campusEdges.map((edge) => {
              const from = campusNodeById.get(edge.from)
              const to = campusNodeById.get(edge.to)
              if (!from || !to) return null
              const key = edgeKey(edge.from, edge.to)
              if (routeEdgeKeys.has(key)) return null
              return (
                <line
                  key={key}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  className="preview-base-edge"
                />
              )
            })}
          </g>

          <g className="preview-nodes">
            {campusNodes.map((node) => {
              if (routeNodeIds.has(node.id)) return null
              return (
                <circle
                  key={node.id}
                  cx={node.x}
                  cy={node.y}
                  r="5"
                  className="preview-base-node"
                />
              )
            })}
          </g>

          <g filter="url(#previewGlow)">
            {result.segments.map((segment) => {
              const from = campusNodeById.get(segment.fromId)
              const to = campusNodeById.get(segment.toId)
              if (!from || !to) return null
              return (
                <line
                  key={`${segment.fromId}-${segment.toId}`}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  className="preview-route-edge"
                />
              )
            })}
          </g>

          {result.segments.map((segment) => {
            const from = campusNodeById.get(segment.fromId)
            const to = campusNodeById.get(segment.toId)
            if (!from || !to) return null
            const midX = (from.x + to.x) / 2
            const midY = (from.y + to.y) / 2
            return (
              <g
                key={`label-${segment.fromId}-${segment.toId}`}
                transform={`translate(${midX} ${midY - 15})`}
                className="preview-distance"
              >
                <rect x="-26" y="-9" width="52" height="18" rx="9" />
                <text textAnchor="middle" y="4">
                  {segment.distance} m
                </text>
              </g>
            )
          })}

          {result.path.map((node, index) => {
            const isStart = index === 0
            const isEnd = index === result.path.length - 1
            const category = categoryById.get(node.category)
            return (
              <g key={node.id} className="preview-route-node-group">
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isStart || isEnd ? 22 : 18}
                  fill={isStart ? '#26a69a' : isEnd ? '#D9A441' : '#FFFEFB'}
                  stroke={isStart ? '#00695c' : isEnd ? '#B78324' : '#26a69a'}
                  strokeWidth="2.5"
                />
                <g
                  transform={`translate(${node.x - 8} ${node.y - 8})`}
                  style={{ color: isStart || isEnd ? '#FFFDF7' : category?.color }}
                >
                  <CampusLocationIcon
                    icon={node.icon}
                    size={16}
                    strokeWidth={1.8}
                  />
                </g>
                <text
                  x={node.x}
                  y={node.y + 38}
                  textAnchor="middle"
                  className="preview-node-label"
                >
                  {node.name}
                </text>
                {isStart && (
                  <text
                    x={node.x}
                    y={node.y - 34}
                    textAnchor="middle"
                    className="preview-node-role start"
                  >
                    START
                  </text>
                )}
                {isEnd && (
                  <text
                    x={node.x}
                    y={node.y - 34}
                    textAnchor="middle"
                    className="preview-node-role end"
                  >
                    DESTINATION
                  </text>
                )}
                <title>{`${node.name} · ${category?.label ?? ''}`}</title>
              </g>
            )
          })}
        </svg>
        <span className="preview-watermark">
          <MapPinned size={13} aria-hidden="true" />
          Full graph · {campusEdges.length} edges
        </span>
      </div>

      <div className="route-preview-footer">
        <span>
          {result.from.name}
          <ArrowRight size={13} aria-hidden="true" />
          {result.to.name}
        </span>
        <span>{result.segments.length} highlighted segments</span>
      </div>
    </div>
  )
}
