import type { AppState, Hive } from './types.ts'

export function tallyInUse(hives: Hive[]): Record<string, number> {
  const tally: Record<string, number> = {}
  for (const hive of hives) {
    for (const layer of hive.stack) {
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

export function unusedForType(state: AppState, typeId: string): number {
  const inUse = tallyInUse(state.hives)
  return unusedCount(ownedCount(state, typeId), inUseCount(inUse, typeId))
}
