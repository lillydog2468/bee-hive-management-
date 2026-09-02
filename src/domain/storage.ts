import {
  BOTTOM_BOARD,
  BUILTIN_TYPES,
  DEEP_USED_FRAME,
  INNER_COVER,
  METAL_LID,
  UNBUILT_SPRING_FRAME,
  WAXED_SPRING_FRAME,
  YARD_FULL_SIZE_IDS,
} from './equipment.ts'
import { ensureRequiredParts } from './requiredParts.ts'
import {
  applyLYardDrawing,
  createSeedState,
  GARAGE,
  HOME_YARD,
  L_YARD_SHAPE,
} from './seed.ts'
import type { AppState, EquipmentType, Hive, Pad, StackLayer } from './types.ts'

const STORAGE_KEY = 'hives.v1'

const SEED_GARAGE_PAD_IDS = new Set([
  'pad-garage-nuc-1',
  'pad-garage-nuc-2',
  'pad-garage-1',
  'pad-garage-2',
  'pad-garage-3',
  'pad-garage-4',
  'pad-garage-5',
  'pad-garage-6',
  'pad-garage-7',
  'pad-garage-8',
])

const YARD_FULL = new Set<string>(YARD_FULL_SIZE_IDS)

type LoosePad = Omit<Pad, 'lockedBottomAndLid'> & {
  lockedBottomAndLid?: boolean
}

export type LooseState = Omit<AppState, 'version' | 'pads'> & {
  version: number
  pads: LoosePad[]
}

function migratePad(pad: LoosePad): Pad {
  return {
    ...pad,
    lockedBottomAndLid:
      pad.lockedBottomAndLid ??
      (pad.siteId === GARAGE && SEED_GARAGE_PAD_IDS.has(pad.id)),
  }
}

function remapFrameLayer(layer: StackLayer): StackLayer {
  if (layer.typeId !== 'deep-frame') return layer
  return { ...layer, typeId: DEEP_USED_FRAME }
}

function mergeTypes(existing: EquipmentType[]): EquipmentType[] {
  const custom = existing.filter(
    (type) => !type.builtIn && type.id !== 'deep-frame',
  )
  return [...BUILTIN_TYPES.map((type) => ({ ...type })), ...custom]
}

function withYardMetalLids(hives: Hive[]): Hive[] {
  return hives.map((hive) => {
    const stack = hive.stack.map(remapFrameLayer)
    if (!YARD_FULL.has(hive.id)) return { ...hive, stack }
    if (stack.some((layer) => layer.role === 'lid')) return { ...hive, stack }
    return {
      ...hive,
      stack: [
        ...stack,
        { id: `lid-${hive.id}`, typeId: METAL_LID, role: 'lid' },
      ],
    }
  })
}

function withHomeYardShape(
  sites: AppState['sites'],
): AppState['sites'] {
  return sites.map((site) =>
    site.id === HOME_YARD
      ? {
          ...site,
          shape: L_YARD_SHAPE.map((p) => ({ ...p })),
          summary:
            'L-shaped apiary from Keith’s drawing. Drag markers as the yard changes. Metal lids on the seven full-size hives.',
        }
      : site,
  )
}

function applyV3(parsed: LooseState): AppState {
  const pads = parsed.pads.map(migratePad)
  const equipmentTypes = mergeTypes(parsed.equipmentTypes ?? [])
  const owned: Record<string, number> = { ...parsed.owned }
  delete owned['deep-frame']
  for (const type of equipmentTypes) {
    if (owned[type.id] === undefined) owned[type.id] = 0
  }
  owned[METAL_LID] = 12
  owned[DEEP_USED_FRAME] = 50
  owned[WAXED_SPRING_FRAME] = 50
  owned[UNBUILT_SPRING_FRAME] = 50
  return toV5({
    ...parsed,
    version: 3,
    equipmentTypes,
    owned,
    hives: withYardMetalLids(parsed.hives),
    pads,
  })
}

function toV5(
  state: Omit<AppState, 'version'> & { version: number },
): AppState {
  const owned = { ...state.owned }
  owned[BOTTOM_BOARD] = 2
  owned[INNER_COVER] = 2
  const next: AppState = {
    ...state,
    version: 5,
    owned,
    sites: withHomeYardShape(state.sites),
    hives: applyLYardDrawing(state.hives),
    pads: state.pads,
  }
  return { ...ensureRequiredParts(next), version: 5 }
}

export function migrateState(parsed: LooseState): AppState | null {
  if (!Array.isArray(parsed.hives) || !Array.isArray(parsed.pads)) return null
  if (parsed.version === 5) {
    return ensureRequiredParts({
      ...parsed,
      version: 5,
      pads: parsed.pads.map(migratePad),
    })
  }
  if (parsed.version === 3 || parsed.version === 4) {
    return toV5({
      ...parsed,
      pads: parsed.pads.map(migratePad),
    })
  }
  if (parsed.version === 1 || parsed.version === 2) return applyV3(parsed)
  return null
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createSeedState()
    const parsed = JSON.parse(raw) as LooseState
    return migrateState(parsed) ?? createSeedState()
  } catch {
    return createSeedState()
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function clearState(): void {
  localStorage.removeItem(STORAGE_KEY)
}
