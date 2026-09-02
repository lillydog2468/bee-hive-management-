import { useRef, type PointerEvent as ReactPointerEvent } from 'react'
import { hiveKindLabel, padSizeLabel } from '../domain/names.ts'
import type { Hive, Pad, Point, Site } from '../domain/types.ts'

type DragKind = 'hive' | 'pad' | 'vertex'

type DragState = {
  kind: DragKind
  id: string
  index?: number
  startX: number
  startY: number
  moved: boolean
}

export function SiteMap({
  site,
  hives,
  pads,
  editShape,
  onMoveHive,
  onMovePad,
  onMoveVertex,
  onOpenHive,
  onOpenPad,
}: {
  site: Site
  hives: Hive[]
  pads: Pad[]
  editShape: boolean
  onMoveHive: (hiveId: string, x: number, y: number) => void
  onMovePad: (padId: string, x: number, y: number) => void
  onMoveVertex: (index: number, point: Point) => void
  onOpenHive: (hiveId: string) => void
  onOpenPad: (padId: string) => void
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const drag = useRef<DragState | null>(null)

  function toPct(clientX: number, clientY: number): Point {
    const rect = rootRef.current?.getBoundingClientRect()
    if (!rect) return { x: 50, y: 50 }
    return {
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100,
    }
  }

  function applyMove(clientX: number, clientY: number) {
    const current = drag.current
    if (!current) return
    const point = toPct(clientX, clientY)
    if (current.kind === 'hive') onMoveHive(current.id, point.x, point.y)
    if (current.kind === 'pad') onMovePad(current.id, point.x, point.y)
    if (current.kind === 'vertex' && current.index !== undefined) {
      onMoveVertex(current.index, point)
    }
  }

  function onPointerDown(
    event: ReactPointerEvent<HTMLButtonElement>,
    kind: DragKind,
    id: string,
    index?: number,
  ) {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = {
      kind,
      id,
      index,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
    }
  }

  function onPointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    const current = drag.current
    if (!current) return
    const dx = event.clientX - current.startX
    const dy = event.clientY - current.startY
    if (!current.moved && dx * dx + dy * dy < 36) return
    current.moved = true
    applyMove(event.clientX, event.clientY)
  }

  function onPointerUp(
    event: ReactPointerEvent<HTMLButtonElement>,
    kind: 'hive' | 'pad' | 'vertex',
    id: string,
  ) {
    const current = drag.current
    drag.current = null
    if (current?.moved) return
    if (kind === 'hive') onOpenHive(id)
    if (kind === 'pad') onOpenPad(id)
    event.preventDefault()
  }

  const occupied = new Set(
    pads.filter((pad) => pad.occupiedHiveId).map((pad) => pad.id),
  )
  const visiblePads = pads.filter((pad) => !occupied.has(pad.id))
  const points = site.shape.map((p) => `${p.x},${p.y}`).join(' ')

  return (
    <div className="map" ref={rootRef}>
      <svg className="map-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        <polygon className="map-ground" points={points} />
      </svg>
      {visiblePads.map((pad) => (
        <button
          key={pad.id}
          type="button"
          className={`marker pad ${pad.size === 'nuc' ? 'is-nuc' : 'is-full'}`}
          style={{ left: `${pad.x}%`, top: `${pad.y}%` }}
          aria-label={`${pad.name}, empty ${padSizeLabel(pad.size)}`}
          onPointerDown={(event) => onPointerDown(event, 'pad', pad.id)}
          onPointerMove={onPointerMove}
          onPointerUp={(event) => onPointerUp(event, 'pad', pad.id)}
        >
          <span className="marker-face" />
          <span className="marker-label">{pad.name}</span>
        </button>
      ))}
      {hives.map((hive) => (
        <button
          key={hive.id}
          type="button"
          className={`marker hive ${hive.kind === 'full-size' ? 'is-full' : 'is-nuc'}`}
          style={{ left: `${hive.x}%`, top: `${hive.y}%` }}
          aria-label={`${hive.name}, ${hiveKindLabel(hive.kind)}`}
          onPointerDown={(event) => onPointerDown(event, 'hive', hive.id)}
          onPointerMove={onPointerMove}
          onPointerUp={(event) => onPointerUp(event, 'hive', hive.id)}
        >
          <span className="marker-face">
            <span className="frames" data-kind={hive.kind} />
          </span>
          <span className="marker-label">{hive.name}</span>
        </button>
      ))}
      {editShape
        ? site.shape.map((point, index) => (
            <button
              key={`v-${index}`}
              type="button"
              className="vertex"
              style={{ left: `${point.x}%`, top: `${point.y}%` }}
              aria-label={`Move corner ${index + 1}`}
              onPointerDown={(event) =>
                onPointerDown(event, 'vertex', `v-${index}`, index)
              }
              onPointerMove={onPointerMove}
              onPointerUp={(event) => onPointerUp(event, 'vertex', `v-${index}`)}
            />
          ))
        : null}
    </div>
  )
}
