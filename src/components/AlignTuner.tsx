import type { DetectedNote } from '../lib/notes'

type AlignTunerProps = {
  note: DetectedNote | null
  cents: number | null
  isListening: boolean
}

const DRIFT_RADIUS_PX = 300
/** 20 layers ≈ full opacity when stacked. */
const LAYER_OPACITY = 0.1
const LAYER_COUNT = 15
/** Cap glow so 20 screen-blended layers don't blow out. */
const GLOW_OPACITY_MAX = 0.18
const CENTS_CLAMP = 100
/** Fully stacked only when this close — near perfect. */
const CENTER_CENTS = 5
/** Horizontal needle travel (matches traditional ±50¢ range). */
const NEEDLE_CENTS_CLAMP = 50
const NEEDLE_TRAVEL_PX = 36

/** Evenly spaced around the circle. */
const LAYER_ANGLES = Array.from(
  { length: LAYER_COUNT },
  (_, i) => (360 / LAYER_COUNT) * i,
)

/**
 * Pitch-class (+ octave) sets the palette root so E2 ≠ A2 when stacked.
 * In tune: hues cluster around that root → a note-specific mix.
 * Drifted: full spectrum, still rotated by the nearest note.
 */
function glowColorForLayer(
  index: number,
  note: DetectedNote | null,
  inTune: boolean,
): string {
  const root =
    note != null
      ? (((note.midi % 12) + 12) % 12) * 30 + note.octave * 8
      : 0

  if (inTune && note != null) {
    const spread = 48
    const hue =
      (root - spread / 2 + (spread / (LAYER_COUNT - 1)) * index + 360) % 360
    return `hsl(${hue} 90% 58%)`
  }

  const hue = (root + (360 / LAYER_COUNT) * index + 360) % 360
  return `hsl(${hue} 85% 58%)`
}

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

/** Invisible at full drift; stacked opacity when centered. */
function opacityForRadius(radius: number): number {
  return LAYER_OPACITY * (1 - radius / DRIFT_RADIUS_PX)
}

/** 2× when fully drifted, 1× when centered. */
function scaleForRadius(radius: number): number {
  return 1 + radius / (DRIFT_RADIUS_PX / 2)
}

function needleOffsetX(cents: number | null): number {
  if (cents == null) return 0
  const clamped = Math.max(
    -NEEDLE_CENTS_CLAMP,
    Math.min(NEEDLE_CENTS_CLAMP, cents),
  )
  return (clamped / NEEDLE_CENTS_CLAMP) * NEEDLE_TRAVEL_PX
}

export function AlignTuner({ note, cents, isListening }: AlignTunerProps) {
  const inTune = cents != null && Math.abs(cents) <= CENTER_CENTS
  const radius = radiusForCents(cents)
  const opacity = opacityForRadius(radius)
  const scale = scaleForRadius(radius)
  const noteLabel = note ? `${note.name}${note.octave}` : '—'
  const offsetX = needleOffsetX(cents)

  return (
    <div
      className={`align-tuner ${inTune ? 'align-tuner--in-tune' : ''} ${!isListening ? 'align-tuner--idle' : ''}`}
    >
      <p className="align-tuner__note" aria-live="polite">
        {noteLabel}
      </p>

      <div className="align-tuner__stage" aria-hidden="true">
        <div className="align-tuner__glows">
          {LAYER_ANGLES.map((angle, index) => {
            const { x, y } = offsetForAngle(angle, radius)
            const glowStrength =
              GLOW_OPACITY_MAX * (1 - radius / DRIFT_RADIUS_PX)
            return (
              <div
                key={`glow-${angle}`}
                className="align-tuner__glow"
                style={{
                  ['--glow' as string]: glowColorForLayer(index, note, inTune),
                  opacity: glowStrength,
                  transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${scale})`,
                }}
              />
            )
          })}
        </div>

        <div className="align-tuner__figures">
          {LAYER_ANGLES.map((angle) => {
            const { x, y } = offsetForAngle(angle, radius)
            return (
              <div
                key={`figure-${angle}`}
                className="align-tuner__sprite"
                style={{
                  transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${scale})`,
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
      </div>

      <p
        className={`align-tuner__status ${inTune ? 'align-tuner__status--visible' : ''}`}
        aria-hidden={!inTune}
      >
        In tune
      </p>

      {isListening && (
        <div className="align-cents" aria-hidden="true">
          <div className="align-cents__track">
            <span className="align-cents__center" />
            <span
              className={`align-cents__needle ${inTune ? 'align-cents__needle--tune' : ''}`}
              style={{ transform: `translateX(${offsetX}px)` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
