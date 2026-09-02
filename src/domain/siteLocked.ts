import { BOTTOM_BOARD, WOODEN_LID } from './equipment.ts'
import { sortStack, stripPoolBottomAndLid } from './stack.ts'
import type { AppState, Hive, Pad, StackLayer } from './types.ts'

export function padById(state: AppState, padId: string | null): Pad | undefined {
  if (!padId) return undefined
  return state.pads.find((pad) => pad.id === padId)
}

export function hivePad(state: AppState, hive: Hive): Pad | undefined {
  return padById(state, hive.padId)
}

export function lockedLayersForPad(pad: Pad): StackLayer[] {
  if (!pad.lockedBottomAndLid) return []
  return [
    {
      id: `${pad.id}:bottom`,
      typeId: BOTTOM_BOARD,
      role: 'bottom',
      siteLocked: true,
    },
    {
      id: `${pad.id}:lid`,
      typeId: WOODEN_LID,
      role: 'lid',
      siteLocked: true,
    },
  ]
}

/** Hive stack plus any pad-owned bottom board and wooden lid. Locked kit is display-only. */
export function displayStack(hive: Hive, pad: Pad | undefined): StackLayer[] {
  const locked = pad ? lockedLayersForPad(pad) : []
  if (locked.length === 0) return hive.stack
  const movable = stripPoolBottomAndLid(hive.stack)
  return sortStack([...locked, ...movable])
}

export function hasLockedBottomAndLid(pad: Pad | undefined): boolean {
  return Boolean(pad?.lockedBottomAndLid)
}
