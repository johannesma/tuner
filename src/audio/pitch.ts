import { YIN } from 'pitchfinder'

export type PitchDetector = (buffer: Float32Array) => number | null

/** Guitar-friendly range: low E (~82Hz) through high frets */
export function createPitchDetector(sampleRate: number): PitchDetector {
  return YIN({
    sampleRate,
    threshold: 0.15,
    probabilityThreshold: 0.1,
  })
}

/**
 * Smooth out occasional YIN outliers with a short median of recent pitches.
 */
export function createPitchSmoother(windowSize = 5) {
  const recent: number[] = []

  return (frequency: number | null): number | null => {
    if (frequency == null || !Number.isFinite(frequency) || frequency <= 0) {
      return null
    }

    recent.push(frequency)
    if (recent.length > windowSize) {
      recent.shift()
    }

    const sorted = [...recent].sort((a, b) => a - b)
    return sorted[Math.floor(sorted.length / 2)] ?? null
  }
}
