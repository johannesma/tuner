/**
 * Bake SpiritualStars-style scraps into a transparent full-bleed PNG.
 * Usage: node scripts/generate-stars.mjs
 * Requires: npx / @resvg/resvg-js (installed transiently for this run).
 */
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { spawnSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUT = join(ROOT, 'public', 'stars.png')
const WIDTH = 1920
const HEIGHT = 1080
const STAR_COUNT = 1200

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

/** Overall scale vs the original SpiritualStars bake (was 0.14). */
const BASE_SCALE = 0.14

function hash(n) {
  const x = Math.sin(n * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

/** ~8% large, ~36% medium, ~36% small, ~20% tiny. */
function sizeFor(h) {
  if (h > 0.92) return 0.65 // ~8% large
  if (h > 0.56) return 0.4 // ~36% medium
  if (h > 0.2) return 0.24 // ~36% small
  return 0.14 // ~20% tiny
}

function buildSvg() {
  const scraps = Array.from({ length: STAR_COUNT }, (_, i) => {
    const h1 = hash(i + 1)
    const h2 = hash(i + 91)
    const h3 = hash(i + 17)
    const h4 = hash(i + 53)
    const h5 = hash(i + 29)
    const h6 = hash(i + 71)
    const h7 = hash(i + 113)
    const size = sizeFor(h3)
    const opacity = 0.14 + h3 * 0.32
    const rotate = h4 * 360
    const path = SCRAP_PATHS[Math.floor(h6 * SCRAP_PATHS.length)]
    const skewX = (h5 - 0.5) * 32
    const stretchX = 0.8 + h6 * 0.4
    const stretchY = 0.8 + h7 * 0.4
    const x = h1 * 100
    const y = h2 * 100
    const sx = size * BASE_SCALE * stretchX
    const sy = size * BASE_SCALE * stretchY
    return `<g transform="translate(${x} ${y}) rotate(${rotate}) skewX(${skewX}) scale(${sx} ${sy})"><path d="${path}" fill="rgba(255, 250, 245, ${opacity.toFixed(3)})"/></g>`
  })

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
  ${scraps.join('\n  ')}
</svg>`
}

async function loadResvg() {
  const require = createRequire(import.meta.url)
  try {
    return require('@resvg/resvg-js')
  } catch {
    console.log('Installing @resvg/resvg-js temporarily…')
    const result = spawnSync(
      'npm',
      ['install', '--no-save', '--no-package-lock', '@resvg/resvg-js'],
      { cwd: ROOT, stdio: 'inherit', shell: process.platform === 'win32' },
    )
    if (result.status !== 0) {
      throw new Error('Failed to install @resvg/resvg-js')
    }
    return require('@resvg/resvg-js')
  }
}

const { Resvg } = await loadResvg()
const svg = buildSvg()
const resvg = new Resvg(svg, {
  fitTo: { mode: 'width', value: WIDTH },
  background: 'rgba(0,0,0,0)',
})
const png = resvg.render().asPng()
writeFileSync(OUT, png)
console.log(`Wrote ${STAR_COUNT} stars → ${OUT} (${png.length} bytes)`)
