import { CentsNeedle } from './CentsNeedle'
import type { DetectedNote } from '../lib/notes'

type TunerDisplayProps = {
  note: DetectedNote | null
  frequency: number | null
  cents: number | null
  isListening: boolean
  level: number
}

function hintForCents(cents: number | null, isListening: boolean): string {
  if (!isListening) return 'Start listening, then play a note'
  if (cents == null) return 'Listening…'
  if (Math.abs(cents) <= 5) return 'In tune'
  if (cents > 0) return 'Sharp — go lower'
  return 'Flat — go higher'
}

export function TunerDisplay({
  note,
  frequency,
  cents,
  isListening,
  level,
}: TunerDisplayProps) {
  const inTune = cents != null && Math.abs(cents) <= 5
  const noteLabel = note ? `${note.name}${note.octave}` : ''
  const centsLabel =
    cents == null ? '—' : `${cents > 0 ? '+' : ''}${cents}¢`
  const freqLabel =
    frequency == null ? '—' : `${frequency.toFixed(1)} Hz`

  return (
    <div
      className={`display ${inTune ? 'display--in-tune' : ''} ${!isListening ? 'display--idle' : ''}`}
    >
      <p className="display__hint">{hintForCents(cents, isListening)}</p>
      <p className="display__note" aria-live="polite">
        {noteLabel || '\u00a0'}
      </p>
      <CentsNeedle cents={cents} inTune={inTune} />
      <div className="display__meta">
        <span>{centsLabel}</span>
        <span>{freqLabel}</span>
      </div>

      <div
        className="display__level"
        title="Microphone input level"
        aria-hidden={!isListening}
      >
        <span className="display__level-label">Mic</span>
        <div
          className="display__level-track"
          role="meter"
          aria-label="Microphone level"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(level * 100)}
        >
          <div
            className="display__level-fill"
            style={{ transform: `scaleX(${Math.min(1, level)})` }}
          />
        </div>
      </div>

      <p
        className={`display__status ${inTune ? 'display__status--visible' : ''}`}
        aria-hidden={!inTune}
      >
        In tune
      </p>
    </div>
  )
}
