import type { DetectedNote } from '../lib/notes'

type AlignTunerProps = {
  note: DetectedNote | null
  cents: number | null
  isListening: boolean
}

const DRIFT_RADIUS_PX = 300
const LAYER_OPACITY = 0.33
const CENTS_CLAMP = 100
/** Fully stacked only when this close — near perfect. */
const CENTER_CENTS = 3

/** Distinct glows — screen-blend into a bright new color when stacked. */
const GLOW_LAYERS = [
  { angle: 20, color: '#ff3b5c' },
  { angle: 145, color: '#2ee6c5' },
  { angle: 250, color: '#5b7cff' },
] as const

function offsetForAngle(degrees: number, radius: number) {
  const radians = (degrees * Math.PI) / 180
  return {
    x: radius * Math.cos(radians),
    y: radius * Math.sin(radians),
  }
}

/**
 * Radius tracks |cents|, but stays visibly drifted until near perfect.
 * Fully centered only within ±CENTER_CENTS; sqrt ease keeps spread longer.
 */
function radiusForCents(cents: number | null): number {
  if (cents == null) return DRIFT_RADIUS_PX
  const abs = Math.min(CENTS_CLAMP, Math.abs(cents))
  if (abs <= CENTER_CENTS) return 0
  const t = (abs - CENTER_CENTS) / (CENTS_CLAMP - CENTER_CENTS)
  return Math.sqrt(t) * DRIFT_RADIUS_PX
}

/** Invisible at full drift (200px); 33% when stacked at center. */
function opacityForRadius(radius: number): number {
  return LAYER_OPACITY * (1 - radius / DRIFT_RADIUS_PX)
}

function statusForCents(cents: number | null, isListening: boolean): string {
  if (!isListening) return 'Start listening, then play a note'
  if (cents == null) return 'Listening…'
  if (Math.abs(cents) <= CENTER_CENTS) return 'In tune'
  if (cents > 0) return 'Sharp — go lower'
  return 'Flat — go higher'
}

export function AlignTuner({ note, cents, isListening }: AlignTunerProps) {
  const inTune = cents != null && Math.abs(cents) <= CENTER_CENTS
  const radius = radiusForCents(cents)
  const opacity = opacityForRadius(radius)
  const noteLabel = note ? `${note.name}${note.octave}` : '—'

  return (
    <div
      className={`align-tuner ${inTune ? 'align-tuner--in-tune' : ''} ${!isListening ? 'align-tuner--idle' : ''}`}
    >
      <p className="align-tuner__hint">{statusForCents(cents, isListening)}</p>
      <p className="align-tuner__note" aria-live="polite">
        {noteLabel}
      </p>

      <div className="align-tuner__stage" aria-hidden="true">
        {GLOW_LAYERS.map(({ angle, color }) => {
          const { x, y } = offsetForAngle(angle, radius)
          const glowStrength = 1 - radius / DRIFT_RADIUS_PX
          return (
            <div
              key={angle}
              className="align-tuner__sprite"
              style={{
                ['--glow' as string]: color,
                ['--glow-strength' as string]: String(glowStrength),
                transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
              }}
            >
              <img
                className="align-tuner__layer"
                src="/center.png"
                alt=""
                style={{ opacity }}
              />
            </div>
          )
        })}
      </div>

      <p
        className={`align-tuner__status ${inTune ? 'align-tuner__status--visible' : ''}`}
        aria-hidden={!inTune}
      >
        In tune
      </p>
    </div>
  )
}
