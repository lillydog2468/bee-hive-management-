import { countRole } from './stack.ts'
import type { Hive } from './types.ts'

/** Keith’s map key: line count = nuc boxes; nested square = large 2-box. */
export function hiveMapBoxCount(hive: Hive): number {
  if (hive.kind === 'full-size') return countRole(hive.stack, 'brood')
  return countRole(hive.stack, 'nuc-box')
}

/** His key has no 3-box large mark — 3+ deeps keep the nested-square glyph. */
export function fullSizeUsesNestedSquare(boxCount: number): boolean {
  return boxCount >= 2
}

/** Nuc line marks stay 1, 2 or 3 as in his key. */
export function nucGlyphLineCount(boxCount: number): number {
  return Math.min(3, Math.max(0, boxCount))
}

/** Nuc lines sit across the L’s downward arm, matching the drawing. */
export function nucLinesFollowPath(hive: Hive): boolean {
  return hive.siteId === 'home-yard' && hive.x >= 62 && hive.y >= 40
}
