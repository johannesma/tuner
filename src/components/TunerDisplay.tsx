import { CentsNeedle } from './CentsNeedle'
import type { DetectedNote } from '../lib/notes'

type TunerDisplayProps = {
  note: DetectedNote | null
  frequency: number | null
  cents: number | null
  stringName: string | null
  isListening: boolean
}

export function TunerDisplay({
  note,
  frequency,
  cents,
  stringName,
  isListening,
}: TunerDisplayProps) {
  const inTune = cents != null && Math.abs(cents) <= 5
  const noteLabel = note ? `${note.name}${note.octave}` : '—'
  const centsLabel =
    cents == null ? '—' : `${cents > 0 ? '+' : ''}${cents}¢`
  const freqLabel =
    frequency == null ? '—' : `${frequency.toFixed(1)} Hz`

  return (
    <div
      className={`display ${inTune ? 'display--in-tune' : ''} ${!isListening ? 'display--idle' : ''}`}
    >
      <p className="display__string">
        {stringName ? `Closest string · ${stringName}` : 'Play a string'}
      </p>
      <p className="display__note" aria-live="polite">
        {noteLabel}
      </p>
      <CentsNeedle cents={cents} inTune={inTune} />
      <div className="display__meta">
        <span>{centsLabel}</span>
        <span>{freqLabel}</span>
      </div>
      {inTune && <p className="display__status">In tune</p>}
    </div>
  )
}
