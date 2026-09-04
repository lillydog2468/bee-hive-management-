import {
  BOTTOM_BOARD,
  DEEP_BOX,
  DEEP_USED_FRAME,
  INNER_COVER,
  METAL_LID,
  NUC_BOX_4,
  NUC_BOX_5,
  SHALLOW_BOX,
  STARTER_TYPES,
  UNBUILT_SPRING_FRAME,
  WAXED_SPRING_FRAME,
} from './equipment.ts'
import { setRoleCount, sortStack } from './stack.ts'
import type { AppState, Hive, Pad, Point, Site, StackLayer } from './types.ts'

export const HOME_YARD = 'home-yard'
export const GARAGE = 'garage'
export const FAR_SIDE = 'far-side'

/** Top bar, downward arm on the right — Keith’s L-shaped apiary drawing. */
export const L_YARD_SHAPE: Point[] = [
  { x: 6, y: 10 },
  { x: 94, y: 10 },
  { x: 94, y: 92 },
  { x: 64, y: 92 },
  { x: 64, y: 38 },
  { x: 6, y: 38 },
]

export const L_YARD_GAP_PAD = {
  id: 'pad-yard-gap',
  name: 'Yard pad 1',
  x: 64,
  y: 24,
} as const

export const L_YARD_PLACES: Record<
  string,
  { x: number; y: number; brood?: 1 | 2; nucBoxes?: 2 | 3 }
> = {
  'hive-yard-nuc-1': { x: 12, y: 24, nucBoxes: 3 },
  'hive-yard-nuc-2': { x: 22, y: 24, nucBoxes: 3 },
  'hive-yard-nuc-3': { x: 32, y: 24, nucBoxes: 3 },
  'hive-yard-1': { x: 44, y: 24, brood: 1 },
  'hive-yard-2': { x: 54, y: 24, brood: 1 },
  'hive-yard-3': { x: 74, y: 24, brood: 2 },
  'hive-yard-4': { x: 84, y: 24, brood: 2 },
  'hive-yard-5': { x: 92, y: 24, brood: 2 },
  'hive-yard-nuc-4': { x: 78, y: 46, nucBoxes: 2 },
  'hive-yard-6': { x: 78, y: 58, brood: 2 },
  'hive-yard-7': { x: 78, y: 70, brood: 2 },
  'hive-yard-nuc-5': { x: 78, y: 82, nucBoxes: 3 },
  'hive-yard-nuc-6': { x: 78, y: 90, nucBoxes: 3 },
}

const GARAGE_SHAPE: Point[] = [
  { x: 6, y: 16 },
  { x: 94, y: 16 },
  { x: 94, y: 84 },
  { x: 6, y: 84 },
]

const FAR_SIDE_SHAPE: Point[] = [
  { x: 22, y: 28 },
  { x: 78, y: 28 },
  { x: 78, y: 72 },
  { x: 22, y: 72 },
]

function hive(
  id: string,
  name: string,
  siteId: string,
  kind: Hive['kind'],
  x: number,
  y: number,
  stack: StackLayer[] = [],
): Hive {
  return { id, name, siteId, kind, stack, x, y, padId: null, feedings: [], inspections: [] }
}

function broodAndLid(n: number, brood: 1 | 2): StackLayer[] {
  const boxes: StackLayer[] = []
  for (let i = 1; i <= brood; i += 1) {
    boxes.push({
      id: `brood-yard-${n}-${i}`,
      typeId: DEEP_BOX,
      role: 'brood',
    })
  }
  return [
    ...boxes,
    { id: `lid-yard-${n}`, typeId: METAL_LID, role: 'lid' },
  ]
}

function nucBoxes(key: string, count: number, typeId: string): StackLayer[] {
  const layers: StackLayer[] = []
  for (let i = 1; i <= count; i += 1) {
    layers.push({
      id: `nuc-${key}-${i}`,
      typeId,
      role: 'nuc-box',
    })
  }
  return layers
}

function pad(
  id: string,
  name: string,
  siteId: string,
  size: Pad['size'],
  x: number,
  y: number,
): Pad {
  return {
    id,
    name,
    siteId,
    size,
    x,
    y,
    occupiedHiveId: null,
    lockedBottomAndLid: siteId === GARAGE,
  }
}

export function applyLYardDrawing(hives: Hive[]): Hive[] {
  let n = 0
  const nextId = () => `lyard-${n++}`
  return hives.map((hive) => {
    let stack = hive.stack.filter(
      (layer) => layer.role !== 'bottom' && layer.role !== 'inner-cover',
    )
    const place = L_YARD_PLACES[hive.id]
    if (!place) return { ...hive, stack: sortStack(stack) }
    if (place.brood) {
      stack = setRoleCount(stack, 'brood', DEEP_BOX, place.brood, nextId)
    }
    if (place.nucBoxes) {
      stack = setRoleCount(stack, 'nuc-box', NUC_BOX_4, place.nucBoxes, nextId)
    }
    return {
      ...hive,
      x: place.x,
      y: place.y,
      stack: sortStack(stack),
    }
  })
}

export function createSeedState(): AppState {
  const sites: Site[] = [
    {
      id: HOME_YARD,
      name: 'Home yard',
      summary:
        'L-shaped apiary from Keith’s drawing. Drag markers as the yard changes. Metal lids on the seven full-size hives.',
      lidTypeId: 'metal-lid',
      shape: L_YARD_SHAPE.map((p) => ({ ...p })),
    },
    {
      id: GARAGE,
      name: 'Above the garage',
      summary:
        'Each pad keeps its own bottom board and wooden lid. Those stay on this site and cannot be used on the L-yard or the far-side hive. Empty pads on the left-hand side.',
      lidTypeId: 'wooden-lid',
      shape: GARAGE_SHAPE.map((p) => ({ ...p })),
    },
    {
      id: FAR_SIDE,
      name: 'Far side of the house',
      summary: 'Third site, not part of the L-yard.',
      lidTypeId: null,
      shape: FAR_SIDE_SHAPE.map((p) => ({ ...p })),
    },
  ]

  // Top arm left → right, then down the right arm (Keith’s drawing).
  const hives: Hive[] = [
    hive('hive-yard-nuc-1', 'Yard nuc 1', HOME_YARD, 'nuc-4', 12, 24, nucBoxes('yard-nuc-1', 3, NUC_BOX_4)),
    hive('hive-yard-nuc-2', 'Yard nuc 2', HOME_YARD, 'nuc-4', 22, 24, nucBoxes('yard-nuc-2', 3, NUC_BOX_4)),
    hive('hive-yard-nuc-3', 'Yard nuc 3', HOME_YARD, 'nuc-4', 32, 24, nucBoxes('yard-nuc-3', 3, NUC_BOX_4)),
    hive('hive-yard-1', 'Yard 1', HOME_YARD, 'full-size', 44, 24, broodAndLid(1, 1)),
    hive('hive-yard-2', 'Yard 2', HOME_YARD, 'full-size', 54, 24, broodAndLid(2, 1)),
    hive('hive-yard-3', 'Yard 3', HOME_YARD, 'full-size', 74, 24, broodAndLid(3, 2)),
    hive('hive-yard-4', 'Yard 4', HOME_YARD, 'full-size', 84, 24, broodAndLid(4, 2)),
    hive('hive-yard-5', 'Yard 5', HOME_YARD, 'full-size', 92, 24, broodAndLid(5, 2)),
    hive('hive-yard-nuc-4', 'Yard nuc 4', HOME_YARD, 'nuc-4', 78, 46, nucBoxes('yard-nuc-4', 2, NUC_BOX_4)),
    hive('hive-yard-6', 'Yard 6', HOME_YARD, 'full-size', 78, 58, broodAndLid(6, 2)),
    hive('hive-yard-7', 'Yard 7', HOME_YARD, 'full-size', 78, 70, broodAndLid(7, 2)),
    hive('hive-yard-nuc-5', 'Yard nuc 5', HOME_YARD, 'nuc-4', 78, 82, nucBoxes('yard-nuc-5', 3, NUC_BOX_4)),
    hive('hive-yard-nuc-6', 'Yard nuc 6', HOME_YARD, 'nuc-4', 78, 90, nucBoxes('yard-nuc-6', 3, NUC_BOX_4)),
    hive(
      'hive-far-side-nuc',
      'Far side nuc',
      FAR_SIDE,
      'nuc-5',
      50,
      50,
      sortStack(nucBoxes('far-side-nuc', 2, NUC_BOX_5)),
    ),
  ]

  const pads: Pad[] = [
    pad(L_YARD_GAP_PAD.id, L_YARD_GAP_PAD.name, HOME_YARD, 'full-size', L_YARD_GAP_PAD.x, L_YARD_GAP_PAD.y),
    pad('pad-garage-nuc-1', 'Nuc pad 1', GARAGE, 'nuc', 16, 32),
    pad('pad-garage-nuc-2', 'Nuc pad 2', GARAGE, 'nuc', 16, 52),
    pad('pad-garage-1', 'Pad 1', GARAGE, 'full-size', 36, 24),
    pad('pad-garage-2', 'Pad 2', GARAGE, 'full-size', 52, 24),
    pad('pad-garage-3', 'Pad 3', GARAGE, 'full-size', 36, 40),
    pad('pad-garage-4', 'Pad 4', GARAGE, 'full-size', 52, 40),
    pad('pad-garage-5', 'Pad 5', GARAGE, 'full-size', 36, 56),
    pad('pad-garage-6', 'Pad 6', GARAGE, 'full-size', 52, 56),
    pad('pad-garage-7', 'Pad 7', GARAGE, 'full-size', 36, 72),
    pad('pad-garage-8', 'Pad 8', GARAGE, 'full-size', 52, 72),
  ]

  const owned: Record<string, number> = {}
  for (const type of STARTER_TYPES) {
    owned[type.id] = 0
  }
  owned[DEEP_BOX] = 20
  owned[SHALLOW_BOX] = 20
  owned[METAL_LID] = 12
  owned[BOTTOM_BOARD] = 2
  owned[INNER_COVER] = 2
  owned[DEEP_USED_FRAME] = 50
  owned[WAXED_SPRING_FRAME] = 50
  owned[UNBUILT_SPRING_FRAME] = 50

  return {
    version: 8,
    appName: 'Hives',
    equipmentTypes: STARTER_TYPES.map((type) => ({ ...type })),
    owned,
    sites,
    hives,
    pads,
    splits: [],
  }
}
