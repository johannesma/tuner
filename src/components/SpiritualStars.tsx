const SCRAP_COUNT = 30
const DRIFT_DISTANCE_PX = 160
const DRIFT_SPEED_PX_PER_S = 5
const DRIFT_DURATION_S = DRIFT_DISTANCE_PX / DRIFT_SPEED_PX_PER_S

/** Irregular crumpled-paper scrap outlines, centered near origin. */
const SCRAP_PATHS = [
  'M-0.95 -0.3 L-0.35 -0.9 L0.35 -0.75 L0.95 -0.2 L0.75 0.45 L0.15 0.95 L-0.55 0.75 L-1.0 0.1 L-0.6 -0.15 Z',
  'M-0.75 -0.9 L0.1 -1.0 L0.8 -0.5 L0.95 0.2 L0.4 0.85 L-0.4 0.9 L-0.95 0.25 L-0.9 -0.4 L-0.35 -0.55 Z',
  'M-1.0 -0.25 L-0.45 -0.85 L0.4 -0.9 L0.95 -0.2 L0.7 0.5 L0.05 0.95 L-0.7 0.55 L-0.9 -0.05 Z',
  'M-0.6 -1.0 L0.35 -0.85 L0.95 -0.15 L0.65 0.7 L-0.2 0.95 L-0.9 0.35 L-0.95 -0.4 L-0.35 -0.55 Z',
  'M-0.9 -0.55 L0.0 -1.0 L0.85 -0.55 L1.0 0.2 L0.45 0.9 L-0.45 0.85 L-1.0 0.1 L-0.55 -0.2 Z',
  'M-0.95 -0.4 L-0.2 -0.95 L0.7 -0.7 L1.0 0.1 L0.5 0.85 L-0.45 0.9 L-1.0 0.2 L-0.65 -0.1 Z',
  'M-0.55 -0.95 L0.3 -1.0 L0.9 -0.35 L0.8 0.45 L0.05 0.95 L-0.8 0.55 L-1.0 -0.2 L-0.4 -0.4 Z',
  'M-1.0 -0.15 L-0.5 -0.85 L0.35 -0.95 L0.95 -0.3 L0.85 0.45 L0.15 0.95 L-0.65 0.7 L-0.95 0.05 Z',
]

type Scrap = {
  x: number
  y: number
  size: number
  opacity: number
  rotate: number
  delay: number
  path: string
  skewX: number
  stretchX: number
  stretchY: number
}

function hash(n: number) {
  const x = Math.sin(n * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

const SCRAPS: Scrap[] = Array.from({ length: SCRAP_COUNT }, (_, i) => {
  const h1 = hash(i + 1)
  const h2 = hash(i + 91)
  const h3 = hash(i + 17)
  const h4 = hash(i + 53)
  const h5 = hash(i + 29)
  const h6 = hash(i + 71)
  const h7 = hash(i + 113)
  return {
    x: h1 * 100,
    y: h2 * 100,
    size: h3 > 0.82 ? 1.2 : h3 > 0.55 ? 0.85 : h3 > 0.28 ? 0.55 : 0.35,
    opacity: 0.16 + h3 * 0.42,
    rotate: h4 * 360,
    // Negative delay = start mid-cycle so every scrap is already drifting.
    delay: -(h4 * DRIFT_DURATION_S),
    path: SCRAP_PATHS[Math.floor(h6 * SCRAP_PATHS.length)]!,
    skewX: (h5 - 0.5) * 32,
    stretchX: 0.8 + h6 * 0.4,
    stretchY: 0.8 + h7 * 0.4,
  }
})

export function SpiritualStars() {
  return (
    <svg
      className="spiritual-stars"
      aria-hidden="true"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
    >
      {SCRAPS.map((scrap, i) => (
        <g
          key={i}
          transform={`translate(${scrap.x} ${scrap.y}) rotate(${scrap.rotate}) skewX(${scrap.skewX}) scale(${scrap.size * 0.14 * scrap.stretchX} ${scrap.size * 0.14 * scrap.stretchY})`}
        >
          <g
            className="spiritual-stars__drift"
            style={{
              animationDuration: `${DRIFT_DURATION_S}s`,
              animationDelay: `${scrap.delay}s`,
            }}
          >
            <path
              d={scrap.path}
              fill={`rgba(255, 250, 245, ${scrap.opacity})`}
            />
          </g>
        </g>
      ))}
    </svg>
  )
}
