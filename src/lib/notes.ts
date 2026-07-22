export const A4_HZ = 440

export const NOTE_NAMES = [
  'C',
  'C♯',
  'D',
  'D♯',
  'E',
  'F',
  'F♯',
  'G',
  'G♯',
  'A',
  'A♯',
  'B',
] as const

/** Standard guitar tuning, low to high */
export const GUITAR_STRINGS = [
  { name: 'E2', frequency: 82.41 },
  { name: 'A2', frequency: 110.0 },
  { name: 'D3', frequency: 146.83 },
  { name: 'G3', frequency: 196.0 },
  { name: 'B3', frequency: 246.94 },
  { name: 'E4', frequency: 329.63 },
] as const

export type DetectedNote = {
  name: string
  octave: number
  frequency: number
  cents: number
  midi: number
}

export function frequencyToMidi(frequency: number, a4 = A4_HZ): number {
  return 69 + 12 * Math.log2(frequency / a4)
}

export function midiToFrequency(midi: number, a4 = A4_HZ): number {
  return a4 * 2 ** ((midi - 69) / 12)
}

export function frequencyToNote(frequency: number, a4 = A4_HZ): DetectedNote {
  const midiFloat = frequencyToMidi(frequency, a4)
  const midi = Math.round(midiFloat)
  const cents = Math.round((midiFloat - midi) * 100)
  const name = NOTE_NAMES[((midi % 12) + 12) % 12]
  const octave = Math.floor(midi / 12) - 1

  return {
    name,
    octave,
    frequency: midiToFrequency(midi, a4),
    cents,
    midi,
  }
}

export function closestGuitarString(frequency: number) {
  let best: (typeof GUITAR_STRINGS)[number] = GUITAR_STRINGS[0]
  let bestDiff = Infinity

  for (const string of GUITAR_STRINGS) {
    const diff = Math.abs(Math.log2(frequency / string.frequency))
    if (diff < bestDiff) {
      bestDiff = diff
      best = string
    }
  }

  return best
}

export function centsFromTarget(frequency: number, targetHz: number): number {
  return Math.round(1200 * Math.log2(frequency / targetHz))
}
