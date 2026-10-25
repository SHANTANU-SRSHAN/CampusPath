import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  campusEdges,
  campusNodeById,
  campusNodes,
  type CampusNode,
} from '../data/campusGraph'
import {
  floydWarshall,
  reconstructPath,
  type AllPairsResult,
  type PathLookup,
  type RouteSegment,
} from '../lib/floydWarshall'

export interface RouteResult {
  from: CampusNode
  to: CampusNode
  distance: number
  status: PathLookup['status']
  path: CampusNode[]
  segments: RouteSegment[]
  edgeCount: number
  walkingSpeed: number
  negativeCycle: boolean
}

interface RouteContextValue {
  allPairs: AllPairsResult
  sourceId: string
  destinationId: string
  result: RouteResult | null
  walkingSpeed: number
  setSourceId: (id: string) => void
  setDestinationId: (id: string) => void
  setWalkingSpeed: (speed: number) => void
  calculateRoute: (fromId?: string, toId?: string) => RouteResult | null
  swapLocations: () => void
  clearSelection: () => void
  clearResult: () => void
}

const DEFAULT_SOURCE = 'main-gate-1'
const DEFAULT_DESTINATION = 'programming-lab'
const DEFAULT_WALKING_SPEED = 1.3

const RouteContext = createContext<RouteContextValue | null>(null)
const nodeIds = campusNodes.map((node) => node.id)

function makeResult(
  lookup: PathLookup,
  fromId: string,
  toId: string,
  negativeCycle: boolean,
  walkingSpeed: number,
): RouteResult | null {
  const from = campusNodeById.get(fromId)
  const to = campusNodeById.get(toId)
  if (!from || !to) return null

  const path = lookup.pathIds
    .map((id) => campusNodeById.get(id))
    .filter((node): node is CampusNode => Boolean(node))

  return {
    from,
    to,
    distance: lookup.distance,
    status: lookup.status,
    path,
    segments: lookup.segments,
    edgeCount: lookup.segments.length,
    walkingSpeed,
    negativeCycle,
  }
}

export function RouteProvider({ children }: { children: ReactNode }) {
  const allPairs = useMemo(() => floydWarshall(nodeIds, campusEdges), [])
  const [sourceId, setSourceIdRaw] = useState(DEFAULT_SOURCE)
  const [destinationId, setDestinationIdRaw] = useState(DEFAULT_DESTINATION)
  const [result, setResult] = useState<RouteResult | null>(null)
  const [walkingSpeed, setWalkingSpeedRaw] = useState(DEFAULT_WALKING_SPEED)

  const setSourceId = useCallback((id: string) => {
    setSourceIdRaw(id)
    setResult(null)
  }, [])

  const setDestinationId = useCallback((id: string) => {
    setDestinationIdRaw(id)
    setResult(null)
  }, [])

  const setWalkingSpeed = useCallback((speed: number) => {
    setWalkingSpeedRaw(speed)
  }, [])

  const calculateRoute = useCallback(
    (fromId?: string, toId?: string) => {
      const from = fromId ?? sourceId
      const to = toId ?? destinationId
      if (!from || !to) return null

      const lookup = reconstructPath(allPairs, from, to)
      const nextResult = makeResult(lookup, from, to, allPairs.negativeCycle, walkingSpeed)

      setSourceIdRaw(from)
      setDestinationIdRaw(to)
      setResult(nextResult)
      return nextResult
    },
    [allPairs, destinationId, sourceId, walkingSpeed],
  )

  const swapLocations = useCallback(() => {
    const nextSource = destinationId
    const nextDestination = sourceId
    setSourceIdRaw(nextSource)
    setDestinationIdRaw(nextDestination)

    if (result && nextSource && nextDestination) {
      const lookup = reconstructPath(allPairs, nextSource, nextDestination)
      setResult(makeResult(lookup, nextSource, nextDestination, allPairs.negativeCycle, walkingSpeed))
    } else {
      setResult(null)
    }
  }, [allPairs, destinationId, result, sourceId, walkingSpeed])

  const clearSelection = useCallback(() => {
    setSourceIdRaw('')
    setDestinationIdRaw('')
    setResult(null)
  }, [])

  const clearResult = useCallback(() => {
    setResult(null)
  }, [])

  const value = useMemo<RouteContextValue>(
    () => ({
      allPairs,
      sourceId,
      destinationId,
      result,
      walkingSpeed,
      setSourceId,
      setDestinationId,
      setWalkingSpeed,
      calculateRoute,
      swapLocations,
      clearSelection,
      clearResult,
    }),
    [
      allPairs,
      calculateRoute,
      clearResult,
      clearSelection,
      destinationId,
      result,
      setDestinationId,
      setSourceId,
      setWalkingSpeed,
      sourceId,
      swapLocations,
      walkingSpeed,
    ],
  )

  return <RouteContext.Provider value={value}>{children}</RouteContext.Provider>
}

export function useRoute() {
  const context = useContext(RouteContext)
  if (!context) {
    throw new Error('useRoute must be used within a RouteProvider')
  }
  return context
}
