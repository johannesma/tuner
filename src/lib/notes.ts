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

/** Nearest equal-tempered note for a frequency (A4 = 440 Hz). */
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
