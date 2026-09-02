import type { EquipmentGroup, EquipmentType } from './types.ts'

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

export const BUILTIN_TYPES: EquipmentType[] = [
  {
    id: DEEP_BOX,
    name: 'Deep box (10-frame)',
    shortName: 'Deep box',
    group: 'boxes',
    builtIn: true,
  },
  {
    id: SHALLOW_BOX,
    name: 'Shallow box (10-frame)',
    shortName: 'Shallow box',
    group: 'boxes',
    builtIn: true,
  },
  {
    id: NUC_BOX_4,
    name: '4-frame nuc box',
    shortName: '4-frame nuc',
    group: 'boxes',
    builtIn: true,
  },
  {
    id: NUC_BOX_5,
    name: '5-frame nuc box',
    shortName: '5-frame nuc',
    group: 'boxes',
    builtIn: true,
  },
  {
    id: DEEP_USED_FRAME,
    name: 'Deep used frames',
    shortName: 'Deep used',
    group: 'frames',
    builtIn: true,
  },
  {
    id: WAXED_SPRING_FRAME,
    name: 'Waxed, ready for spring',
    shortName: 'Waxed (spring)',
    group: 'frames',
    builtIn: true,
  },
  {
    id: UNBUILT_SPRING_FRAME,
    name: 'Unbuilt, ready for spring',
    shortName: 'Unbuilt (spring)',
    group: 'frames',
    builtIn: true,
  },
  {
    id: SHALLOW_FRAME,
    name: 'Shallow frames',
    shortName: 'Shallow frames',
    group: 'frames',
    builtIn: true,
  },
  {
    id: BOTTOM_BOARD,
    name: 'Bottom board',
    shortName: 'Bottom board',
    group: 'parts',
    builtIn: true,
  },
  {
    id: INNER_COVER,
    name: 'Inner cover',
    shortName: 'Inner cover',
    group: 'parts',
    builtIn: true,
  },
  {
    id: METAL_LID,
    name: 'Metal lid',
    shortName: 'Metal lid',
    group: 'parts',
    builtIn: true,
  },
  {
    id: WOODEN_LID,
    name: 'Wooden lid',
    shortName: 'Wooden lid',
    group: 'parts',
    builtIn: true,
  },
  {
    id: ROUND_FEEDER,
    name: 'Round feeder',
    shortName: 'Round feeder',
    group: 'feeding',
    builtIn: true,
  },
  {
    id: FEEDING_JAR,
    name: 'Feeding jar',
    shortName: 'Feeding jar',
    group: 'feeding',
    builtIn: true,
  },
]

export const GROUP_LABELS: Record<EquipmentGroup, string> = {
  boxes: 'Boxes',
  frames: 'Frames',
  parts: 'Hive parts',
  feeding: 'Feeding',
  custom: 'Other types',
}

export const FRAME_CONDITION_IDS = [
  DEEP_USED_FRAME,
  WAXED_SPRING_FRAME,
  UNBUILT_SPRING_FRAME,
] as const

/** Waxed and unbuilt lots are a mix of deep and shallow; the split is not given. */
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

export const GROUP_ORDER: EquipmentGroup[] = [
  'boxes',
  'frames',
  'parts',
  'feeding',
  'custom',
]

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
