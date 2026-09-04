import type { EquipmentGroup, EquipmentType, FrameTotal } from './types.ts'

export const DEEP_BOX = 'deep-box'
export const SHALLOW_BOX = 'shallow-box'
export const NUC_BOX_4 = 'nuc-box-4'
export const NUC_BOX_5 = 'nuc-box-5'
export const DEEP_USED_FRAME = 'deep-used-frame'
export const WAXED_SPRING_FRAME = 'waxed-spring-frame'
export const UNBUILT_SPRING_FRAME = 'unbuilt-spring-frame'
export const SHALLOW_FRAME = 'shallow-frame'
export const BOTTOM_BOARD = 'bottom-board'
export const INNER_COVER = 'inner-cover'
export const METAL_LID = 'metal-lid'
export const WOODEN_LID = 'wooden-lid'
export const ROUND_FEEDER = 'round-feeder'
export const FEEDING_JAR = 'feeding-jar'

function starter(
  id: string,
  name: string,
  shortName: string,
  group: EquipmentGroup,
  unit: string,
  frameTotal: FrameTotal = null,
): EquipmentType {
  return {
    id,
    name,
    shortName,
    group,
    builtIn: false,
    unit,
    frameTotal,
  }
}

/** Short list Keith can delete. Frame lots keep his existing counts. No feeders. */
export const STARTER_TYPES: EquipmentType[] = [
  starter(DEEP_BOX, 'Deep box (10-frame)', 'Deep box', 'boxes', 'boxes'),
  starter(SHALLOW_BOX, 'Shallow box (10-frame)', 'Shallow box', 'boxes', 'boxes'),
  starter(NUC_BOX_4, '4-frame nuc box', '4-frame nuc', 'boxes', 'boxes'),
  starter(NUC_BOX_5, '5-frame nuc box', '5-frame nuc', 'boxes', 'boxes'),
  starter(
    DEEP_USED_FRAME,
    'Deep used frames',
    'Deep used',
    'frames',
    'frames',
    'deep',
  ),
  starter(
    WAXED_SPRING_FRAME,
    'Waxed, ready for spring',
    'Waxed (spring)',
    'frames',
    'frames',
  ),
  starter(
    UNBUILT_SPRING_FRAME,
    'Unbuilt, ready for spring',
    'Unbuilt (spring)',
    'frames',
    'frames',
  ),
  starter(
    SHALLOW_FRAME,
    'Shallow frames',
    'Shallow frames',
    'frames',
    'frames',
    'shallow',
  ),
  starter(BOTTOM_BOARD, 'Bottom board', 'Bottom board', 'other', ''),
  starter(INNER_COVER, 'Inner cover', 'Inner cover', 'other', ''),
  starter(METAL_LID, 'Metal lid', 'Metal lid', 'lids', ''),
  starter(WOODEN_LID, 'Wooden lid', 'Wooden lid', 'lids', ''),
]

/** @deprecated Use STARTER_TYPES. Kept so older migrate paths still have a name. */
export const BUILTIN_TYPES = STARTER_TYPES

export const GROUP_LABELS: Record<EquipmentGroup, string> = {
  boxes: 'Boxes',
  frames: 'Frames',
  lids: 'Lids',
  other: 'Other',
}

export const GROUP_ORDER: EquipmentGroup[] = [
  'boxes',
  'frames',
  'lids',
  'other',
]

export const FRAME_CONDITION_IDS = [
  DEEP_USED_FRAME,
  WAXED_SPRING_FRAME,
  UNBUILT_SPRING_FRAME,
] as const

export const SPRING_FRAME_LOT_IDS = [
  WAXED_SPRING_FRAME,
  UNBUILT_SPRING_FRAME,
] as const

export const YARD_FULL_SIZE_IDS = [
  'hive-yard-1',
  'hive-yard-2',
  'hive-yard-3',
  'hive-yard-4',
  'hive-yard-5',
  'hive-yard-6',
  'hive-yard-7',
] as const

export function boxDepth(
  typeId: string,
): 'deep' | 'shallow' | 'nuc' | 'other' {
  if (typeId === DEEP_BOX) return 'deep'
  if (typeId === SHALLOW_BOX) return 'shallow'
  if (typeId === NUC_BOX_4 || typeId === NUC_BOX_5) return 'nuc'
  return 'other'
}

export function nucBoxType(kind: 'nuc-4' | 'nuc-5'): string {
  return kind === 'nuc-4' ? NUC_BOX_4 : NUC_BOX_5
}

export const STARTER_IDS = new Set(STARTER_TYPES.map((type) => type.id))

export function defaultUnitForGroup(group: EquipmentGroup): string {
  if (group === 'boxes') return 'boxes'
  if (group === 'frames') return 'frames'
  return ''
}

export function defaultFrameTotal(typeId: string): FrameTotal {
  if (typeId === DEEP_USED_FRAME) return 'deep'
  if (typeId === SHALLOW_FRAME) return 'shallow'
  return null
}

export function migrateEquipmentGroup(
  group: string,
  typeId: string,
): EquipmentGroup {
  if (
    group === 'boxes' ||
    group === 'frames' ||
    group === 'lids' ||
    group === 'other'
  ) {
    return group
  }
  if (typeId === METAL_LID || typeId === WOODEN_LID) return 'lids'
  return 'other'
}

export type LooseEquipmentType = {
  id: string
  name?: string
  shortName?: string
  group?: string
  builtIn?: boolean
  unit?: string
  frameTotal?: FrameTotal | null
}

export function normalizeEquipmentType(raw: LooseEquipmentType): EquipmentType {
  const group = migrateEquipmentGroup(raw.group ?? 'other', raw.id)
  const name = (raw.name ?? raw.shortName ?? 'Untitled').trim() || 'Untitled'
  const shortName = (raw.shortName ?? name).trim() || name
  const hasFrameTotal = Object.prototype.hasOwnProperty.call(raw, 'frameTotal')
  return {
    id: raw.id,
    name,
    shortName,
    group,
    builtIn: false,
    unit: raw.unit !== undefined ? raw.unit : defaultUnitForGroup(group),
    frameTotal:
      raw.frameTotal === 'deep' || raw.frameTotal === 'shallow'
        ? raw.frameTotal
        : hasFrameTotal
          ? null
          : defaultFrameTotal(raw.id),
  }
}
