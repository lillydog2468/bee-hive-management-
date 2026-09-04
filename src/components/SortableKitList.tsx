import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { KitThumb } from './KitIllustration.tsx'
import {
  inUseCount,
  isUncountedOnHives,
  unusedCount,
} from '../domain/inventory.ts'
import type { EquipmentGroup, EquipmentType } from '../domain/types.ts'
import { useStore } from '../state/context.ts'

export function SortableKitList({
  group,
  types,
  noteFor,
  onOpen,
}: {
  group: EquipmentGroup
  types: EquipmentType[]
  noteFor: (typeId: string) => string | undefined
  onOpen: (typeId: string) => void
}) {
  const { state, dispatch, inUse } = useStore()
  const [previewIds, setPreviewIds] = useState<string[] | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const drag = useRef<{
    id: string
    pointerId: number
    originIds: string[]
    lastIds: string[]
    mids: number[]
  } | null>(null)
  const listRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    if (drag.current) return
    setPreviewIds(null)
  }, [types])

  const originIds = types.map((type) => type.id)
  const shown = (previewIds ?? originIds)
    .map((id) => types.find((type) => type.id === id))
    .filter((type): type is EquipmentType => Boolean(type))

  function indexFromY(clientY: number): number {
    const mids = drag.current?.mids
    if (!mids || mids.length === 0) return 0
    for (let i = 0; i < mids.length; i += 1) {
      if (clientY < mids[i]!) return i
    }
    return mids.length - 1
  }

  function previewFromPointer(clientY: number, origin: string[], typeId: string) {
    const from = origin.indexOf(typeId)
    const to = indexFromY(clientY)
    if (from < 0) return origin
    const next = [...origin]
    const [moved] = next.splice(from, 1)
    if (!moved) return origin
    next.splice(to, 0, moved)
    return next
  }

  function onHandlePointerDown(
    event: PointerEvent<HTMLButtonElement>,
    typeId: string,
  ) {
    if (event.button !== 0) return
    const list = listRef.current
    if (!list || types.length < 2) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    const rows = [...list.querySelectorAll<HTMLElement>('[data-kit-id]')]
    drag.current = {
      id: typeId,
      pointerId: event.pointerId,
      originIds,
      lastIds: originIds,
      mids: rows.map((row) => {
        const box = row.getBoundingClientRect()
        return box.top + box.height / 2
      }),
    }
    setDraggingId(typeId)
    setPreviewIds(originIds)
  }

  function onHandlePointerMove(event: PointerEvent<HTMLButtonElement>) {
    const current = drag.current
    if (!current || current.pointerId !== event.pointerId) return
    event.preventDefault()
    const next = previewFromPointer(
      event.clientY,
      current.originIds,
      current.id,
    )
    current.lastIds = next
    setPreviewIds(next)
  }

  function finishDrag(event: PointerEvent<HTMLButtonElement>, commit: boolean) {
    const current = drag.current
    if (!current || current.pointerId !== event.pointerId) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    const toIndex = current.lastIds.indexOf(current.id)
    const fromIndex = current.originIds.indexOf(current.id)
    drag.current = null
    setDraggingId(null)
    setPreviewIds(null)
    if (!commit || toIndex < 0 || toIndex === fromIndex) return
    dispatch({
      type: 'reorder-equipment',
      group,
      typeId: current.id,
      toIndex,
    })
  }

  if (shown.length === 0) return null

  return (
    <ul className="kit-list" ref={listRef}>
      {shown.map((type) => (
        <KitRow
          key={type.id}
          type={type}
          owned={state.owned[type.id] ?? 0}
          used={inUseCount(inUse, type.id)}
          note={noteFor(type.id)}
          dragging={draggingId === type.id}
          showHandle={types.length > 1}
          onOpen={() => onOpen(type.id)}
          onHandlePointerDown={(event) => onHandlePointerDown(event, type.id)}
          onHandlePointerMove={onHandlePointerMove}
          onHandlePointerUp={(event) => finishDrag(event, true)}
          onHandlePointerCancel={(event) => finishDrag(event, false)}
        />
      ))}
    </ul>
  )
}

function KitRow({
  type,
  owned,
  used,
  onOpen,
  note,
  dragging,
  showHandle,
  onHandlePointerDown,
  onHandlePointerMove,
  onHandlePointerUp,
  onHandlePointerCancel,
}: {
  type: EquipmentType
  owned: number
  used: number
  onOpen: () => void
  note?: string
  dragging: boolean
  showHandle: boolean
  onHandlePointerDown: (event: PointerEvent<HTMLButtonElement>) => void
  onHandlePointerMove: (event: PointerEvent<HTMLButtonElement>) => void
  onHandlePointerUp: (event: PointerEvent<HTMLButtonElement>) => void
  onHandlePointerCancel: (event: PointerEvent<HTMLButtonElement>) => void
}) {
  const { photos } = useStore()
  const unused = unusedCount(owned, used)
  const free = Math.max(0, unused)
  const uncounted = isUncountedOnHives(owned, used)
  const short = owned > 0 && used > owned
  const extras = [
    uncounted ? 'owned not counted yet' : '',
    short ? `short by ${used - owned}` : '',
    note ?? '',
  ].filter(Boolean)
  return (
    <li
      className={dragging ? 'kit-item is-dragging' : 'kit-item'}
      data-kit-id={type.id}
    >
      {showHandle ? (
        <button
          type="button"
          className="drag-handle"
          aria-label={`Reorder ${type.name}`}
          onPointerDown={onHandlePointerDown}
          onPointerMove={onHandlePointerMove}
          onPointerUp={onHandlePointerUp}
          onPointerCancel={onHandlePointerCancel}
          onContextMenu={(event) => event.preventDefault()}
        >
          <span aria-hidden="true" className="drag-grip" />
        </button>
      ) : null}
      <button type="button" className="kit-row" onClick={onOpen}>
        <KitThumb typeId={type.id} photo={photos.types[type.id]} />
        <span className="kit-copy">
          <span className="kit-name">{type.name}</span>
          <span className="kit-meta">
            {owned} owned · {used} on hives
            {type.unit ? ` · ${type.unit}` : ''}
            {extras.length > 0 ? ` · ${extras.join(' · ')}` : ''}
          </span>
        </span>
        <span
          className={
            short
              ? 'kit-count is-short'
              : uncounted
                ? 'kit-count is-uncounted'
                : free > 0
                  ? 'kit-count is-free'
                  : 'kit-count'
          }
        >
          {free}
        </span>
      </button>
    </li>
  )
}
