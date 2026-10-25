import type { CampusEdge } from '../data/campusGraph'

export const INF = Number.POSITIVE_INFINITY

export interface MatrixState {
  dist: number[][]
  next: number[][]
  direct: number[][]
  indexById: Map<string, number>
  nodeIds: string[]
}

export interface AllPairsResult extends MatrixState {
  negativeCycle: boolean
  negativeCycleIndices: number[]
}

export interface RouteSegment {
  fromId: string
  toId: string
  distance: number
}

export type RouteStatus = 'found' | 'same-location' | 'unreachable' | 'negative-cycle'

export interface PathLookup {
  status: RouteStatus
  distance: number
  pathIds: string[]
  segments: RouteSegment[]
}

export interface ComparisonRecord {
  step: number
  k: number
  i: number
  j: number
  previousDistance: number
  viaDistance: number
  newDistance: number
  updated: boolean
  previousNext: number
  newNext: number
}

export interface FloydTrace {
  nodeIds: string[]
  indexById: Map<string, number>
  initialDist: number[][]
  initialNext: number[][]
  finalDist: number[][]
  finalNext: number[][]
  direct: number[][]
  records: ComparisonRecord[]
  negativeCycle: boolean
  negativeCycleIndices: number[]
}

export function cloneMatrix(matrix: number[][]): number[][] {
  return matrix.map((row) => [...row])
}

/**
 * Builds the weighted adjacency matrices for any subset of the campus graph.
 * Undirected edges create both directions. Edges outside the selected node set
 * are ignored, which allows the visualizer to show smaller induced graphs.
 */
export function buildMatrices(nodeIds: string[], edges: CampusEdge[]): MatrixState {
  const n = nodeIds.length
  const indexById = new Map(nodeIds.map((id, index) => [id, index]))
  const dist = Array.from({ length: n }, () => Array<number>(n).fill(INF))
  const next = Array.from({ length: n }, () => Array<number>(n).fill(-1))
  const direct = Array.from({ length: n }, () => Array<number>(n).fill(INF))

  for (let i = 0; i < n; i += 1) {
    dist[i][i] = 0
    direct[i][i] = 0
    next[i][i] = i
  }

  for (const edge of edges) {
    const fromIndex = indexById.get(edge.from)
    const toIndex = indexById.get(edge.to)
    if (fromIndex === undefined || toIndex === undefined) continue
    if (!Number.isFinite(edge.distance)) continue

    if (fromIndex === toIndex) {
      // A negative self-loop is a negative cycle. Nonnegative loops do not
      // improve the initial zero-distance diagonal.
      if (edge.distance < dist[fromIndex][fromIndex]) {
        dist[fromIndex][fromIndex] = edge.distance
        direct[fromIndex][fromIndex] = edge.distance
        next[fromIndex][fromIndex] = fromIndex
      }
      continue
    }

    if (edge.distance < dist[fromIndex][toIndex]) {
      dist[fromIndex][toIndex] = edge.distance
      direct[fromIndex][toIndex] = edge.distance
      next[fromIndex][toIndex] = toIndex
    }

    if (!edge.directed && edge.distance < dist[toIndex][fromIndex]) {
      dist[toIndex][fromIndex] = edge.distance
      direct[toIndex][fromIndex] = edge.distance
      next[toIndex][fromIndex] = fromIndex
    }
  }

  return { dist, next, direct, indexById, nodeIds }
}

function detectNegativeCycles(dist: number[][]): number[] {
  const indices: number[] = []
  for (let i = 0; i < dist.length; i += 1) {
    if (dist[i][i] < 0) indices.push(i)
  }
  return indices
}

/** Computes all-pairs shortest paths using Floyd–Warshall. */
export function floydWarshall(nodeIds: string[], edges: CampusEdge[]): AllPairsResult {
  const matrices = buildMatrices(nodeIds, edges)
  const { dist, next } = matrices
  const n = nodeIds.length

  for (let k = 0; k < n; k += 1) {
    for (let i = 0; i < n; i += 1) {
      if (dist[i][k] === INF) continue
      for (let j = 0; j < n; j += 1) {
        if (dist[k][j] === INF) continue
        const throughK = dist[i][k] + dist[k][j]
        if (throughK < dist[i][j]) {
          dist[i][j] = throughK
          next[i][j] = next[i][k]
        }
      }
    }
  }

  const negativeCycleIndices = detectNegativeCycles(dist)
  return {
    ...matrices,
    negativeCycle: negativeCycleIndices.length > 0,
    negativeCycleIndices,
  }
}

/**
 * Runs Floyd–Warshall while recording every comparison. The visualizer can
 * step forward and backward using these records without storing V³ matrices.
 */
export function traceFloydWarshall(nodeIds: string[], edges: CampusEdge[]): FloydTrace {
  const matrices = buildMatrices(nodeIds, edges)
  const initialDist = cloneMatrix(matrices.dist)
  const initialNext = cloneMatrix(matrices.next)
  const dist = cloneMatrix(matrices.dist)
  const next = cloneMatrix(matrices.next)
  const n = nodeIds.length
  const records: ComparisonRecord[] = []
  let step = 0

  for (let k = 0; k < n; k += 1) {
    for (let i = 0; i < n; i += 1) {
      for (let j = 0; j < n; j += 1) {
        const previousDistance = dist[i][j]
        const viaDistance =
          dist[i][k] === INF || dist[k][j] === INF
            ? INF
            : dist[i][k] + dist[k][j]
        const previousNext = next[i][j]

        let updated = false
        let newDistance = previousDistance
        let newNext = previousNext

        if (viaDistance < previousDistance) {
          newDistance = viaDistance
          newNext = next[i][k]
          dist[i][j] = newDistance
          next[i][j] = newNext
          updated = true
        }

        records.push({
          step,
          k,
          i,
          j,
          previousDistance,
          viaDistance,
          newDistance,
          updated,
          previousNext,
          newNext,
        })
        step += 1
      }
    }
  }

  const negativeCycleIndices = detectNegativeCycles(dist)

  return {
    nodeIds,
    indexById: matrices.indexById,
    initialDist,
    initialNext,
    finalDist: cloneMatrix(dist),
    finalNext: cloneMatrix(next),
    direct: matrices.direct,
    records,
    negativeCycle: negativeCycleIndices.length > 0,
    negativeCycleIndices,
  }
}

/**
 * Reconstructs a path from the next-hop matrix. The direct matrix is used to
 * report the weight of each traversed edge, so the displayed sum can be checked
 * against the Floyd–Warshall distance.
 */
export function reconstructPath(result: MatrixState, fromId: string, toId: string): PathLookup {
  const fromIndex = result.indexById.get(fromId)
  const toIndex = result.indexById.get(toId)
  const negativeCycle =
    'negativeCycle' in result && Boolean((result as AllPairsResult).negativeCycle)

  if (fromIndex === undefined || toIndex === undefined) {
    return {
      status: 'unreachable',
      distance: INF,
      pathIds: [],
      segments: [],
    }
  }

  if (negativeCycle) {
    return {
      status: 'negative-cycle',
      distance: INF,
      pathIds: [],
      segments: [],
    }
  }

  if (fromIndex === toIndex) {
    return {
      status: 'same-location',
      distance: 0,
      pathIds: [fromId],
      segments: [],
    }
  }

  const distance = result.dist[fromIndex][toIndex]
  if (distance === INF) {
    return {
      status: 'unreachable',
      distance: INF,
      pathIds: [],
      segments: [],
    }
  }

  const indices = [fromIndex]
  let current = fromIndex
  let guard = 0

  while (current !== toIndex && guard <= result.nodeIds.length) {
    const nextIndex = result.next[current][toIndex]
    if (nextIndex < 0 || nextIndex === current) {
      return {
        status: 'unreachable',
        distance: INF,
        pathIds: [],
        segments: [],
      }
    }
    indices.push(nextIndex)
    current = nextIndex
    guard += 1
  }

  if (current !== toIndex) {
    return {
      status: 'unreachable',
      distance: INF,
      pathIds: [],
      segments: [],
    }
  }

  const pathIds = indices.map((index) => result.nodeIds[index])
  const segments: RouteSegment[] = []
  let segmentSum = 0

  for (let index = 0; index < indices.length - 1; index += 1) {
    const from = indices[index]
    const to = indices[index + 1]
    const edgeDistance = result.direct[from][to]
    if (!Number.isFinite(edgeDistance)) {
      return {
        status: 'unreachable',
        distance: INF,
        pathIds: [],
        segments: [],
      }
    }
    segmentSum += edgeDistance
    segments.push({
      fromId: result.nodeIds[from],
      toId: result.nodeIds[to],
      distance: edgeDistance,
    })
  }

  // Guard against an inconsistent matrix or a malformed trace.
  if (segmentSum !== distance) {
    return {
      status: 'unreachable',
      distance: INF,
      pathIds: [],
      segments: [],
    }
  }

  return {
    status: 'found',
    distance,
    pathIds,
    segments,
  }
}

export function countFiniteMatrixPairs(result: MatrixState): number {
  let count = 0
  for (const row of result.dist) {
    for (const value of row) {
      if (Number.isFinite(value)) count += 1
    }
  }
  return count
}

export function getNonNegativeWeights(edges: CampusEdge[]): boolean {
  return edges.every((edge) => Number.isFinite(edge.distance) && edge.distance >= 0)
}
