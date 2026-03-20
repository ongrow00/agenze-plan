import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'

const CELL = 28

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Caminho só em horizontais/verticais, nos vértices do grid (como linhas do BGPattern). */
function randomGridWalk(
  cols: number,
  rows: number,
  steps: number,
  rng: () => number,
): [number, number][] {
  const pts: [number, number][] = []
  let x = Math.floor(rng() * (cols + 1))
  let y = Math.floor(rng() * (rows + 1))
  pts.push([x, y])

  const dirs = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ] as const

  for (let i = 0; i < steps; i++) {
    const order = [...dirs].sort(() => rng() - 0.5)
    let moved = false
    for (const [dx, dy] of order) {
      const nx = x + dx
      const ny = y + dy
      if (nx >= 0 && nx <= cols && ny >= 0 && ny <= rows) {
        x = nx
        y = ny
        pts.push([x, y])
        moved = true
        break
      }
    }
    if (!moved) {
      for (const [dx, dy] of dirs) {
        const nx = x + dx
        const ny = y + dy
        if (nx >= 0 && nx <= cols && ny >= 0 && ny <= rows) {
          x = nx
          y = ny
          pts.push([x, y])
          break
        }
      }
    }
  }
  return pts
}

function pointsToD(points: [number, number][], cell: number): string {
  if (points.length === 0) return ''
  const [x0, y0] = points[0]
  let d = `M ${x0 * cell} ${y0 * cell}`
  for (let i = 1; i < points.length; i++) {
    const [x, y] = points[i]
    d += ` L ${x * cell} ${y * cell}`
  }
  return d
}

type Props = {
  /** Mesmo tamanho de célula do BGPattern */
  cellSize?: number
  isDark: boolean
}

export function GridSnakeTrail({ cellSize = CELL, isDark }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const [dims, setDims] = useState({ w: 0, h: 0 })
  const [pathKey, setPathKey] = useState(0)
  const [pathLen, setPathLen] = useState(0)
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduceMotion(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect()
      setDims({ w: Math.round(r.width), h: Math.round(r.height) })
    })
    ro.observe(el)
    const r = el.getBoundingClientRect()
    setDims({ w: Math.round(r.width), h: Math.round(r.height) })
    return () => ro.disconnect()
  }, [])

  const cols = Math.max(1, Math.floor(dims.w / cellSize))
  const rows = Math.max(1, Math.floor(dims.h / cellSize))

  const pathD = useMemo(() => {
    if (dims.w < 16 || dims.h < 16) return ''
    const rng = mulberry32(pathKey * 7919 + cols * 97 + rows * 131)
    const steps = Math.min(3200, Math.max(120, cols * rows * 5))
    const pts = randomGridWalk(cols, rows, steps, rng)
    return pointsToD(pts, cellSize)
  }, [cols, rows, pathKey, dims.w, dims.h, cellSize])

  const remeasure = useCallback(() => {
    const p = pathRef.current
    if (!p || !pathD) {
      setPathLen(0)
      return
    }
    const len = p.getTotalLength()
    setPathLen(len)
  }, [pathD])

  useEffect(() => {
    const id = requestAnimationFrame(() => remeasure())
    return () => cancelAnimationFrame(id)
  }, [remeasure, pathD])

  useEffect(() => {
    const p = pathRef.current
    if (!p || reduceMotion || pathLen < 32) return
    const onIter = () => setPathKey((k) => k + 1)
    p.addEventListener('animationiteration', onIter)
    return () => p.removeEventListener('animationiteration', onIter)
  }, [pathD, reduceMotion, pathLen])

  const trail = Math.min(260, Math.max(72, pathLen * 0.11))
  const gap = Math.max(0, pathLen - trail)
  const dashArray = pathLen > 0 ? `${trail} ${gap}` : '0 0'
  const durationSec = pathLen > 0 ? Math.min(160, Math.max(72, pathLen / 14)) : 80

  const stroke = isDark ? 'rgba(160, 186, 252, 0.78)' : 'rgba(66, 51, 176, 0.52)'

  const wrapStyle: CSSProperties = {
    ['--snake-path-len' as string]: `${pathLen}px`,
    ['--snake-duration' as string]: `${durationSec}s`,
  }

  return (
    <div ref={wrapRef} className="grid-snake-wrap" aria-hidden style={wrapStyle}>
      <svg
        className="grid-snake-svg"
        width="100%"
        height="100%"
        viewBox={`0 0 ${dims.w || 1} ${dims.h || 1}`}
        preserveAspectRatio="none"
      >
        <path
          ref={pathRef}
          className={reduceMotion ? '' : 'grid-snake-path'}
          d={pathD}
          fill="none"
          stroke={stroke}
          strokeWidth={1}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={dashArray}
          vectorEffect="non-scaling-stroke"
          style={reduceMotion ? { strokeDashoffset: pathLen * 0.28 } : undefined}
        />
      </svg>
    </div>
  )
}
