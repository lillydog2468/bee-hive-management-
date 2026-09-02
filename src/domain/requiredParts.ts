import {
  BOTTOM_BOARD,
  INNER_COVER,
  METAL_LID,
} from './equipment.ts'
import { HOME_YARD } from './seed.ts'
import { hasLockedBottomAndLid } from './siteLocked.ts'
import {
  hasRole,
  sortStack,
  stripPoolBottomAndLid,
} from './stack.ts'
import type { AppState, Hive, Pad, StackLayer } from './types.ts'

/** Full-size hives on the L-yard use a metal lid. Not the nucs, and not garage pads. */
export function hiveShouldHaveMetalLid(
  hive: Hive,
  pad: Pad | undefined,
): boolean {
  if (hive.kind !== 'full-size') return false
  if (hive.siteId !== HOME_YARD) return false
  if (hasLockedBottomAndLid(pad)) return false
  return true
}

/** Pad wooden lids count; otherwise the hive still needs a lid type recorded. */
export function hiveNeedsLidChoice(
  hive: Hive,
  pad: Pad | undefined,
): boolean {
  if (hasLockedBottomAndLid(pad)) return false
  return !hasRole(hive.stack, 'lid')
}

export function canRemoveLayer(
  _hive: Hive,
  pad: Pad | undefined,
  layer: StackLayer,
): boolean {
  if (layer.siteLocked) return false
  if (layer.role === 'inner-cover') return false
  if (hasLockedBottomAndLid(pad)) return true
  if (layer.role === 'bottom' || layer.role === 'lid') return false
  return true
}

export function stackAfterClear(hive: Hive, pad: Pad | undefined): StackLayer[] {
  const locked = hasLockedBottomAndLid(pad)
  const kept = hive.stack.filter((layer) => {
    if (layer.role === 'inner-cover') return true
    if (!locked && (layer.role === 'bottom' || layer.role === 'lid')) return true
    return false
  })
  return ensureHiveRequiredParts({ ...hive, stack: kept }, pad).stack
}

export function ensureHiveRequiredParts(
  hive: Hive,
  pad: Pad | undefined,
): Hive {
  const locked = hasLockedBottomAndLid(pad)
  let stack = hive.stack
  if (locked) {
    const stripped = stripPoolBottomAndLid(hive.stack)
    if (stripped.length !== hive.stack.length) stack = stripped
  }

  const add: StackLayer[] = []
  if (!locked && !hasRole(stack, 'bottom')) {
    add.push({
      id: `${hive.id}:bottom`,
      typeId: BOTTOM_BOARD,
      role: 'bottom',
    })
  }
  if (!hasRole(stack, 'inner-cover')) {
    add.push({
      id: `${hive.id}:inner-cover`,
      typeId: INNER_COVER,
      role: 'inner-cover',
    })
  }
  if (!locked && hiveShouldHaveMetalLid(hive, pad) && !hasRole(stack, 'lid')) {
    add.push({
      id: `${hive.id}:lid`,
      typeId: METAL_LID,
      role: 'lid',
    })
  }

  if (add.length === 0 && stack === hive.stack) return hive
  return { ...hive, stack: sortStack([...stack, ...add]) }
}

export function ensureRequiredParts(state: AppState): AppState {
  let changed = false
  const hives = state.hives.map((hive) => {
    const pad = hive.padId
      ? state.pads.find((item) => item.id === hive.padId)
      : undefined
    const next = ensureHiveRequiredParts(hive, pad)
    if (next !== hive) changed = true
    return next
  })
  return changed ? { ...state, hives } : state
}
