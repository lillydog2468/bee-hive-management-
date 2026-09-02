import { countRole } from './stack.ts'
import type { Hive } from './types.ts'

/** Keith’s map key: line count = nuc boxes; nested square = large 2-box. */
export function hiveMapBoxCount(hive: Hive): number {
  if (hive.kind === 'full-size') return countRole(hive.stack, 'brood')
  return countRole(hive.stack, 'nuc-box')
}

/** Nuc lines sit across the L’s downward arm, matching the drawing. */
export function nucLinesFollowPath(hive: Hive): boolean {
  return hive.siteId === 'home-yard' && hive.x >= 62 && hive.y >= 40
}
