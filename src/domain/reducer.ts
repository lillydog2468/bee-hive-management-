import {
  defaultUnitForGroup,
  METAL_LID,
  nucBoxType,
  reorderTypesInGroup,
} from './equipment.ts'
import { isAllowedInspectionBox } from './inspection.ts'
import { stripTypeFromStacks, typeOnStacksCount } from './inventory.ts'
import { defaultHiveName, defaultPadName } from './names.ts'
import {
  canRemoveLayer,
  ensureRequiredParts,
  hiveShouldHaveMetalLid,
  stackAfterClear,
} from './requiredParts.ts'
import { createSeedState } from './seed.ts'
import { hasLockedBottomAndLid, hivePad } from './siteLocked.ts'
import {
  addExtra,
  countRole,
  removeLayer,
  setFeeding,
  setRoleCount,
  stripPoolBottomAndLid,
  toggleRole,
} from './stack.ts'
import type {
  AppState,
  EquipmentGroup,
  FeedingConfig,
  FrameTotal,
  HiveKind,
  Inspection,
  PadSize,
  Point,
  QueenMarkColour,
  QueenMarked,
} from './types.ts'

export type Action =
  | { type: 'rename-app'; name: string }
  | { type: 'set-owned'; typeId: string; owned: number }
  | {
      type: 'add-equipment-type'
      id: string
      name: string
      group?: EquipmentGroup
      unit?: string
      frameTotal?: FrameTotal
      owned?: number
    }
  | {
      type: 'update-equipment-type'
      typeId: string
      name?: string
      group?: EquipmentGroup
      unit?: string
      frameTotal?: FrameTotal
    }
  | {
      type: 'remove-equipment-type'
      typeId: string
      stripFromStacks?: boolean
    }
  | {
      type: 'reorder-equipment'
      group: EquipmentGroup
      typeId: string
      toIndex: number
    }
  | { type: 'rename-hive'; hiveId: string; name: string }
  | { type: 'rename-site'; siteId: string; name: string }
  | { type: 'move-hive'; hiveId: string; siteId: string; padId?: string }
  | { type: 'set-hive-pos'; hiveId: string; x: number; y: number }
  | { type: 'set-pad-pos'; padId: string; x: number; y: number }
  | { type: 'set-shape'; siteId: string; shape: Point[] }
  | { type: 'set-brood'; hiveId: string; count: number }
  | { type: 'set-supers'; hiveId: string; count: number }
  | { type: 'set-nuc-boxes'; hiveId: string; count: number }
  | {
      type: 'toggle-part'
      hiveId: string
      part: 'bottom' | 'inner-cover' | 'lid'
      on: boolean
      lidTypeId?: string
    }
  | { type: 'set-feeding'; hiveId: string; feeding: FeedingConfig | null }
  | { type: 'add-extra'; hiveId: string; extraId: string; typeId: string }
  | { type: 'remove-layer'; hiveId: string; layerId: string }
  | { type: 'clear-stack'; hiveId: string }
  | {
      type: 'add-hive'
      id: string
      siteId: string
      kind: HiveKind
      x: number
      y: number
      padId?: string
    }
  | { type: 'remove-hive'; hiveId: string }
  | {
      type: 'add-pad'
      id: string
      siteId: string
      size: PadSize
      x: number
      y: number
    }
  | { type: 'remove-pad'; padId: string }
  | { type: 'place-hive-on-pad'; hiveId: string; padId: string }
  | {
      type: 'add-feeding'
      hiveId: string
      id: string
      date: string
      litres: number
    }
  | { type: 'remove-feeding'; hiveId: string; feedingId: string }
  | {
      type: 'record-split'
      id: string
      date: string
      sourceHiveId: string
      destPadId: string
      newHiveId: string
    }
  | { type: 'add-site'; id: string; name: string }
  | {
      type: 'add-inspection'
      hiveId: string
      id: string
      date: string
      strength: 1 | 2 | 3 | 4 | 5
      eggs: boolean
      larvae: boolean
      cappedBrood: boolean
      droneCells: boolean
      queenCells: boolean
      queenSeen: boolean
      queenMarked: QueenMarked
      queenMarkColour: QueenMarkColour | null
      notes: string
      addedBoxTypeId: string | null
      addedFrameTypeId: string | null
      addedFrameCount: number
      destPadId: string | null
      splitId: string
      newHiveId: string
    }
  | { type: 'reset-seed' }

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function withHive(
  state: AppState,
  hiveId: string,
  update: (hive: AppState['hives'][number]) => AppState['hives'][number],
): AppState {
  return {
    ...state,
    hives: state.hives.map((hive) => (hive.id === hiveId ? update(hive) : hive)),
  }
}

function clearPadOccupation(state: AppState, hiveId: string): AppState {
  return {
    ...state,
    pads: state.pads.map((pad) =>
      pad.occupiedHiveId === hiveId ? { ...pad, occupiedHiveId: null } : pad,
    ),
  }
}

function occupyPad(state: AppState, padId: string, hiveId: string): AppState {
  const pad = state.pads.find((item) => item.id === padId)
  if (!pad) return state
  let next = clearPadOccupation(state, hiveId)
  next = {
    ...next,
    pads: next.pads.map((item) =>
      item.id === padId
        ? { ...item, occupiedHiveId: hiveId }
        : item.occupiedHiveId === hiveId
          ? { ...item, occupiedHiveId: null }
          : item,
    ),
  }
  return withHive(next, hiveId, (hive) => ({
    ...hive,
    siteId: pad.siteId,
    x: pad.x,
    y: pad.y,
    padId,
    stack: pad.lockedBottomAndLid
      ? stripPoolBottomAndLid(hive.stack)
      : hive.stack,
  }))
}

const ids = {
  layer: () => crypto.randomUUID(),
}

export function reducer(state: AppState, action: Action): AppState {
  return ensureRequiredParts(reduce(state, action))
}

function reduce(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'rename-app':
      return { ...state, appName: action.name.trim() || state.appName }
    case 'set-owned':
      return {
        ...state,
        owned: {
          ...state.owned,
          [action.typeId]: Math.max(0, Math.round(action.owned)),
        },
      }
    case 'add-equipment-type': {
      const name = action.name.trim()
      if (!name) return state
      if (state.equipmentTypes.some((type) => type.id === action.id)) {
        return state
      }
      const group = action.group ?? 'other'
      const unit =
        action.unit !== undefined ? action.unit.trim() : defaultUnitForGroup(group)
      const frameTotal =
        action.frameTotal === 'deep' || action.frameTotal === 'shallow'
          ? action.frameTotal
          : null
      return {
        ...state,
        equipmentTypes: [
          ...state.equipmentTypes,
          {
            id: action.id,
            name,
            shortName: name,
            group,
            builtIn: false,
            unit,
            frameTotal,
          },
        ],
        owned: {
          ...state.owned,
          [action.id]: Math.max(0, Math.round(action.owned ?? 0)),
        },
      }
    }
    case 'update-equipment-type': {
      const current = state.equipmentTypes.find(
        (item) => item.id === action.typeId,
      )
      if (!current) return state
      const name = action.name !== undefined ? action.name.trim() : current.name
      if (!name) return state
      const group = action.group ?? current.group
      const unit =
        action.unit !== undefined ? action.unit.trim() : current.unit
      const frameTotal =
        action.frameTotal === undefined
          ? current.frameTotal
          : action.frameTotal === 'deep' || action.frameTotal === 'shallow'
            ? action.frameTotal
            : null
      return {
        ...state,
        equipmentTypes: state.equipmentTypes.map((item) =>
          item.id === action.typeId
            ? {
                ...item,
                name,
                shortName: name,
                group,
                unit,
                frameTotal,
              }
            : item,
        ),
      }
    }
    case 'remove-equipment-type': {
      const type = state.equipmentTypes.find((item) => item.id === action.typeId)
      if (!type) return state
      const used = typeOnStacksCount(state.hives, action.typeId)
      if (used > 0 && !action.stripFromStacks) return state
      const hives =
        used > 0 ? stripTypeFromStacks(state.hives, action.typeId) : state.hives
      const owned = { ...state.owned }
      delete owned[action.typeId]
      return {
        ...state,
        hives,
        equipmentTypes: state.equipmentTypes.filter(
          (item) => item.id !== action.typeId,
        ),
        owned,
      }
    }
    case 'reorder-equipment': {
      const nextTypes = reorderTypesInGroup(
        state.equipmentTypes,
        action.group,
        action.typeId,
        action.toIndex,
      )
      if (nextTypes === state.equipmentTypes) return state
      return { ...state, equipmentTypes: nextTypes }
    }
    case 'rename-hive':
      return withHive(state, action.hiveId, (hive) => ({
        ...hive,
        name: action.name.trim() || hive.name,
      }))
    case 'rename-site':
      return {
        ...state,
        sites: state.sites.map((site) =>
          site.id === action.siteId
            ? { ...site, name: action.name.trim() || site.name }
            : site,
        ),
      }
    case 'move-hive': {
      if (action.padId) return occupyPad(state, action.padId, action.hiveId)
      const next = clearPadOccupation(state, action.hiveId)
      return withHive(next, action.hiveId, (hive) => ({
        ...hive,
        siteId: action.siteId,
        padId: null,
      }))
    }
    case 'set-hive-pos': {
      const next = clearPadOccupation(state, action.hiveId)
      return withHive(next, action.hiveId, (hive) => ({
        ...hive,
        x: clamp(action.x, 4, 96),
        y: clamp(action.y, 4, 96),
        padId: null,
      }))
    }
    case 'set-pad-pos':
      return {
        ...state,
        pads: state.pads.map((pad) =>
          pad.id === action.padId
            ? {
                ...pad,
                x: clamp(action.x, 4, 96),
                y: clamp(action.y, 4, 96),
              }
            : pad,
        ),
        hives: state.hives.map((hive) => {
          const pad = state.pads.find((item) => item.id === action.padId)
          if (!pad || hive.padId !== action.padId) return hive
          return {
            ...hive,
            x: clamp(action.x, 4, 96),
            y: clamp(action.y, 4, 96),
          }
        }),
      }
    case 'set-shape':
      return {
        ...state,
        sites: state.sites.map((site) =>
          site.id === action.siteId ? { ...site, shape: action.shape } : site,
        ),
      }
    case 'set-brood':
      return withHive(state, action.hiveId, (hive) => ({
        ...hive,
        stack: setRoleCount(
          hive.stack,
          'brood',
          DEEP_BOX_ID,
          Math.max(0, Math.round(action.count)),
          ids.layer,
        ),
      }))
    case 'set-supers':
      return withHive(state, action.hiveId, (hive) => ({
        ...hive,
        stack: setRoleCount(
          hive.stack,
          'super',
          SHALLOW_BOX_ID,
          Math.max(0, action.count),
          ids.layer,
        ),
      }))
    case 'set-nuc-boxes':
      return withHive(state, action.hiveId, (hive) => {
        if (hive.kind === 'full-size') return hive
        return {
          ...hive,
          stack: setRoleCount(
            hive.stack,
            'nuc-box',
            nucBoxType(hive.kind),
            Math.max(0, action.count),
            ids.layer,
          ),
        }
      })
    case 'toggle-part':
      return withHive(state, action.hiveId, (hive) => {
        const pad = hivePad(state, hive)
        if (
          hasLockedBottomAndLid(pad) &&
          (action.part === 'bottom' || action.part === 'lid')
        ) {
          return hive
        }
        // Bottom, inner cover and lid stay on every hive once present.
        if (!action.on) return hive
        if (action.part === 'bottom') {
          return {
            ...hive,
            stack: toggleRole(
              hive.stack,
              'bottom',
              BOTTOM_BOARD_ID,
              true,
              ids.layer,
            ),
          }
        }
        if (action.part === 'inner-cover') {
          return {
            ...hive,
            stack: toggleRole(
              hive.stack,
              'inner-cover',
              INNER_COVER_ID,
              true,
              ids.layer,
            ),
          }
        }
        if (hive.stack.some((layer) => layer.role === 'lid')) return hive
        const metalLocked = hiveShouldHaveMetalLid(hive, pad)
        const lidTypeId = metalLocked
          ? METAL_LID
          : (action.lidTypeId ??
            state.sites.find((item) => item.id === hive.siteId)?.lidTypeId)
        if (!lidTypeId) return hive
        if (!state.equipmentTypes.some((item) => item.id === lidTypeId)) {
          return hive
        }
        return {
          ...hive,
          stack: toggleRole(hive.stack, 'lid', lidTypeId, true, ids.layer),
        }
      })
    case 'set-feeding':
      return withHive(state, action.hiveId, (hive) => ({
        ...hive,
        stack: setFeeding(hive.stack, action.feeding, ids.layer),
      }))
    case 'add-extra':
      return withHive(state, action.hiveId, (hive) => ({
        ...hive,
        stack: addExtra(hive.stack, action.typeId, () => action.extraId),
      }))
    case 'remove-layer':
      return withHive(state, action.hiveId, (hive) => {
        const layer = hive.stack.find((item) => item.id === action.layerId)
        if (!layer || !canRemoveLayer(hive, hivePad(state, hive), layer)) {
          return hive
        }
        return { ...hive, stack: removeLayer(hive.stack, action.layerId) }
      })
    case 'clear-stack':
      return withHive(state, action.hiveId, (hive) => ({
        ...hive,
        stack: stackAfterClear(hive, hivePad(state, hive)),
      }))
    case 'add-hive': {
      const site = state.sites.find((item) => item.id === action.siteId)
      const name = defaultHiveName(
        action.siteId,
        action.kind,
        state.hives,
        site?.name,
      )
      let next: AppState = {
        ...state,
        hives: [
          ...state.hives,
          {
            id: action.id,
            name,
            siteId: action.siteId,
            kind: action.kind,
            stack: [],
            x: action.x,
            y: action.y,
            padId: action.padId ?? null,
            feedings: [],
            inspections: [],
          },
        ],
      }
      if (action.padId) next = occupyPad(next, action.padId, action.id)
      return next
    }
    case 'remove-hive': {
      const next = clearPadOccupation(state, action.hiveId)
      return {
        ...next,
        hives: next.hives.filter((hive) => hive.id !== action.hiveId),
      }
    }
    case 'add-pad':
      return {
        ...state,
        pads: [
          ...state.pads,
          {
            id: action.id,
            name: defaultPadName(action.size, state.pads),
            siteId: action.siteId,
            size: action.size,
            x: action.x,
            y: action.y,
            occupiedHiveId: null,
            lockedBottomAndLid: false,
          },
        ],
      }
    case 'remove-pad': {
      const pad = state.pads.find((item) => item.id === action.padId)
      if (!pad) return state
      return {
        ...state,
        pads: state.pads.filter((item) => item.id !== action.padId),
        hives: state.hives.map((hive) =>
          hive.padId === action.padId ? { ...hive, padId: null } : hive,
        ),
      }
    }
    case 'place-hive-on-pad':
      return occupyPad(state, action.padId, action.hiveId)
    case 'add-feeding': {
      const litres = Math.round(action.litres * 100) / 100
      if (!(litres > 0) || !action.date) return state
      return withHive(state, action.hiveId, (hive) => ({
        ...hive,
        feedings: [
          ...hive.feedings,
          { id: action.id, date: action.date, litres },
        ],
      }))
    }
    case 'remove-feeding':
      return withHive(state, action.hiveId, (hive) => ({
        ...hive,
        feedings: hive.feedings.filter((entry) => entry.id !== action.feedingId),
      }))
    case 'record-split': {
      const source = state.hives.find((hive) => hive.id === action.sourceHiveId)
      const pad = state.pads.find((item) => item.id === action.destPadId)
      if (!source || !pad || pad.occupiedHiveId) return state
      const site = state.sites.find((item) => item.id === pad.siteId)
      const kind: HiveKind = pad.size === 'nuc' ? 'nuc-4' : 'full-size'
      let next = reduce(state, {
        type: 'add-hive',
        id: action.newHiveId,
        siteId: pad.siteId,
        kind,
        x: pad.x,
        y: pad.y,
        padId: pad.id,
      })
      const dest = next.hives.find((hive) => hive.id === action.newHiveId)
      if (!dest) return state
      return {
        ...next,
        splits: [
          ...next.splits,
          {
            id: action.id,
            date: action.date,
            sourceHiveId: source.id,
            sourceName: source.name,
            destHiveId: dest.id,
            destName: dest.name,
            destPadId: pad.id,
            destSiteId: pad.siteId,
            destSiteName: site?.name ?? pad.siteId,
          },
        ],
      }
    }
    case 'add-site': {
      const name = action.name.trim()
      if (!name) return state
      if (state.sites.some((site) => site.id === action.id)) return state
      return {
        ...state,
        sites: [
          ...state.sites,
          {
            id: action.id,
            name,
            summary: 'Add empty pads and drag hives where they sit.',
            lidTypeId: null,
            shape: [
              { x: 10, y: 12 },
              { x: 90, y: 12 },
              { x: 90, y: 88 },
              { x: 10, y: 88 },
            ],
          },
        ],
      }
    }
    case 'add-inspection':
      return addInspection(state, action)
    case 'reset-seed':
      return createSeedState()
  }
}

const DEEP_BOX_ID = 'deep-box'
const SHALLOW_BOX_ID = 'shallow-box'
const BOTTOM_BOARD_ID = 'bottom-board'
const INNER_COVER_ID = 'inner-cover'

type AddInspectionAction = Extract<Action, { type: 'add-inspection' }>

function addInspection(state: AppState, action: AddInspectionAction): AppState {
  const hive = state.hives.find((item) => item.id === action.hiveId)
  if (!hive || !action.date) return state
  if (action.strength < 1 || action.strength > 5) return state
  if (action.destPadId) {
    const pad = state.pads.find((item) => item.id === action.destPadId)
    if (!pad || pad.occupiedHiveId) return state
  }

  let next = state
  if (
    action.addedBoxTypeId &&
    isAllowedInspectionBox(
      hive.kind,
      action.addedBoxTypeId,
      state.equipmentTypes,
    )
  ) {
    next = applyInspectionBox(next, hive.id, action.addedBoxTypeId)
  }

  const frameCount = Math.max(0, Math.round(action.addedFrameCount))
  if (action.addedFrameTypeId && frameCount > 0) {
    const typeOk = next.equipmentTypes.some(
      (type) => type.id === action.addedFrameTypeId && type.group === 'frames',
    )
    if (typeOk) {
      for (let i = 0; i < frameCount; i += 1) {
        next = reduce(next, {
          type: 'add-extra',
          hiveId: hive.id,
          extraId: ids.layer(),
          typeId: action.addedFrameTypeId,
        })
      }
    }
  }

  let splitId: string | null = null
  if (action.destPadId) {
    next = reduce(next, {
      type: 'record-split',
      id: action.splitId,
      date: action.date,
      sourceHiveId: hive.id,
      destPadId: action.destPadId,
      newHiveId: action.newHiveId,
    })
    splitId = next.splits.some((item) => item.id === action.splitId)
      ? action.splitId
      : null
    if (!splitId) return state
  }

  const colour =
    action.queenMarked === 'yes' ? action.queenMarkColour : null
  const inspection: Inspection = {
    id: action.id,
    date: action.date,
    strength: action.strength,
    eggs: action.eggs,
    larvae: action.larvae,
    cappedBrood: action.cappedBrood,
    droneCells: action.droneCells,
    queenCells: action.queenCells,
    queenSeen: action.queenSeen,
    queenMarked: action.queenMarked,
    queenMarkColour: colour,
    notes: action.notes.trim(),
    addedBoxTypeId: action.addedBoxTypeId,
    addedFrameTypeId: frameCount > 0 ? action.addedFrameTypeId : null,
    addedFrameCount: frameCount,
    splitId,
  }

  return withHive(next, hive.id, (item) => ({
    ...item,
    inspections: [...item.inspections, inspection],
  }))
}

function applyInspectionBox(
  state: AppState,
  hiveId: string,
  typeId: string,
): AppState {
  const hive = state.hives.find((item) => item.id === hiveId)
  if (!hive) return state
  if (typeId === DEEP_BOX_ID) {
    return reduce(state, {
      type: 'set-brood',
      hiveId,
      count: countRole(hive.stack, 'brood') + 1,
    })
  }
  if (typeId === SHALLOW_BOX_ID) {
    return reduce(state, {
      type: 'set-supers',
      hiveId,
      count: countRole(hive.stack, 'super') + 1,
    })
  }
  if (hive.kind !== 'full-size' && typeId === nucBoxType(hive.kind)) {
    return reduce(state, {
      type: 'set-nuc-boxes',
      hiveId,
      count: countRole(hive.stack, 'nuc-box') + 1,
    })
  }
  return state
}

