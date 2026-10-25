import { INF } from './floydWarshall'

export function formatDistance(distance: number): string {
  if (distance === INF || !Number.isFinite(distance)) return 'Unreachable'
  return `${Math.round(distance).toLocaleString('en-IN')} m`
}

export function formatMatrixValue(distance: number): string {
  return Number.isFinite(distance) ? String(Math.round(distance)) : '∞'
}

export function formatWalkTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return 'Unavailable'
  if (seconds === 0) return 'You are already here'
  if (seconds < 60) return `${Math.max(1, Math.round(seconds))} sec`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.round(seconds % 60)
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes} min ${remainingSeconds} sec` : `${minutes} min`
  }
  const hours = Math.floor(minutes / 60)
  return `${hours} hr ${minutes % 60} min`
}

export function formatWalkTimeShort(seconds: number): string {
  if (seconds === 0) return '0 min'
  if (seconds < 60) return '< 1 min'
  return `${Math.max(1, Math.round(seconds / 60))} min`
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`
}
