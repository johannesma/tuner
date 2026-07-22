import { Macleod, YIN } from 'pitchfinder'

export type PitchDetector = (buffer: Float32Array) => number | null

/** Prefer McLeod when confident; fall back to YIN. */
export function createPitchDetector(sampleRate: number): PitchDetector {
  const yin = YIN({
    sampleRate,
    threshold: 0.15,
    probabilityThreshold: 0.1,
  })

  const macleod = Macleod({
    sampleRate,
    bufferSize: 4096,
    cutoff: 0.9,
  })

  return (buffer: Float32Array) => {
    const mac = macleod(buffer)
    if (
      mac &&
      Number.isFinite(mac.freq) &&
      mac.freq > 0 &&
      mac.probability >= 0.85
    ) {
      return mac.freq
    }

    return yin(buffer)
  }
}

/**
 * Smooth out occasional outliers with a short median.
 * Clears history on silence so the next note isn't stuck on the previous one.
 */
export function createPitchSmoother(windowSize = 3) {
  const recent: number[] = []

  return (frequency: number | null): number | null => {
    if (frequency == null || !Number.isFinite(frequency) || frequency <= 0) {
      recent.length = 0
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
