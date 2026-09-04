import type { AppState, FrameTotal, Hive } from './types.ts'

export function tallyInUse(hives: Hive[]): Record<string, number> {
  const tally: Record<string, number> = {}
  for (const hive of hives) {
    for (const layer of hive.stack) {
      if (layer.siteLocked) continue
      tally[layer.typeId] = (tally[layer.typeId] ?? 0) + 1
    }
  }
  return tally
}

export function ownedCount(state: AppState, typeId: string): number {
  return state.owned[typeId] ?? 0
}

export function inUseCount(
  inUse: Record<string, number>,
  typeId: string,
): number {
  return inUse[typeId] ?? 0
}

/** Owned kit not currently assigned to a hive stack. May be negative if stock is short. */
export function unusedCount(owned: number, inUse: number): number {
  return owned - inUse
}

export function shortfallCount(owned: number, inUse: number): number {
  return Math.max(0, inUse - owned)
}

/**
 * Kit already on hives with owned still 0. That is “not counted yet”, not a
 * stock error — do not treat it as a blocker.
 */
export function isUncountedOnHives(owned: number, inUse: number): boolean {
  return owned === 0 && inUse > 0
}

export function unusedForType(state: AppState, typeId: string): number {
  const inUse = tallyInUse(state.hives)
  return unusedCount(ownedCount(state, typeId), inUseCount(inUse, typeId))
}

/** Pieces of this type sitting on hive stacks (not garage pad display kit). */
export function typeOnStacksCount(hives: Hive[], typeId: string): number {
  let count = 0
  for (const hive of hives) {
    for (const layer of hive.stack) {
      if (layer.typeId === typeId) count += 1
    }
  }
  return count
}

export function stripTypeFromStacks(hives: Hive[], typeId: string): Hive[] {
  return hives.map((hive) => ({
    ...hive,
    stack: hive.stack.filter((layer) => layer.typeId !== typeId),
  }))
}

export function framesTotalForTag(
  state: AppState,
  tag: Exclude<FrameTotal, null>,
): { owned: number; inUse: number; unused: number } {
  const inUse = tallyInUse(state.hives)
  let owned = 0
  let used = 0
  for (const type of state.equipmentTypes) {
    if (type.frameTotal !== tag) continue
    owned += ownedCount(state, type.id)
    used += inUseCount(inUse, type.id)
  }
  return { owned, inUse: used, unused: unusedCount(owned, used) }
}
