import { BUILTIN_TYPES, DEEP_BOX, NUC_BOX_5, SHALLOW_BOX } from './equipment.ts'
import type { AppState, Hive, Pad, Point, Site, StackLayer } from './types.ts'

export const HOME_YARD = 'home-yard'
export const GARAGE = 'garage'
export const FAR_SIDE = 'far-side'

const L_YARD_SHAPE: Point[] = [
  { x: 8, y: 8 },
  { x: 92, y: 8 },
  { x: 92, y: 42 },
  { x: 40, y: 42 },
  { x: 40, y: 92 },
  { x: 8, y: 92 },
]

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
  return { id, name, siteId, kind, stack, x, y, padId: null }
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

export function createSeedState(): AppState {
  const sites: Site[] = [
    {
      id: HOME_YARD,
      name: 'Home yard',
      summary: 'L-shaped yard. Always changing. Metal lids.',
      lidTypeId: 'metal-lid',
      shape: L_YARD_SHAPE.map((p) => ({ ...p })),
    },
    {
      id: GARAGE,
      name: 'Above the garage',
      summary: 'Each pad keeps its own bottom board and wooden lid. Empty pads on the left-hand side.',
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

  const hives: Hive[] = [
    hive('hive-yard-1', 'Yard 1', HOME_YARD, 'full-size', 18, 22),
    hive('hive-yard-2', 'Yard 2', HOME_YARD, 'full-size', 36, 22),
    hive('hive-yard-3', 'Yard 3', HOME_YARD, 'full-size', 54, 22),
    hive('hive-yard-4', 'Yard 4', HOME_YARD, 'full-size', 72, 22),
    hive('hive-yard-5', 'Yard 5', HOME_YARD, 'full-size', 22, 54),
    hive('hive-yard-6', 'Yard 6', HOME_YARD, 'full-size', 22, 70),
    hive('hive-yard-7', 'Yard 7', HOME_YARD, 'full-size', 22, 84),
    hive('hive-yard-nuc-1', 'Yard nuc 1', HOME_YARD, 'nuc-4', 50, 34),
    hive('hive-yard-nuc-2', 'Yard nuc 2', HOME_YARD, 'nuc-4', 66, 34),
    hive('hive-yard-nuc-3', 'Yard nuc 3', HOME_YARD, 'nuc-4', 82, 34),
    hive('hive-yard-nuc-4', 'Yard nuc 4', HOME_YARD, 'nuc-4', 32, 54),
    hive('hive-yard-nuc-5', 'Yard nuc 5', HOME_YARD, 'nuc-4', 32, 70),
    hive('hive-yard-nuc-6', 'Yard nuc 6', HOME_YARD, 'nuc-4', 32, 84),
    hive('hive-far-side-nuc', 'Far side nuc', FAR_SIDE, 'nuc-5', 50, 50, [
      { id: 'layer-far-1', typeId: NUC_BOX_5, role: 'nuc-box' },
      { id: 'layer-far-2', typeId: NUC_BOX_5, role: 'nuc-box' },
    ]),
  ]

  const pads: Pad[] = [
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
  for (const type of BUILTIN_TYPES) {
    owned[type.id] = 0
  }
  owned[DEEP_BOX] = 20
  owned[SHALLOW_BOX] = 20

  return {
    version: 2,
    appName: 'Hives',
    equipmentTypes: BUILTIN_TYPES.map((type) => ({ ...type })),
    owned,
    sites,
    hives,
    pads,
  }
}
