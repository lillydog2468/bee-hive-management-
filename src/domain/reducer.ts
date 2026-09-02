import { METAL_LID, nucBoxType } from './equipment.ts'
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
  removeLayer,
  setFeeding,
  setRoleCount,
  stripPoolBottomAndLid,
  toggleRole,
} from './stack.ts'
import type {
  AppState,
  FeedingConfig,
  HiveKind,
  PadSize,
  Point,
} from './types.ts'

export type Action =
  | { type: 'rename-app'; name: string }
  | { type: 'set-owned'; typeId: string; owned: number }
  | { type: 'add-equipment-type'; id: string; name: string }
  | { type: 'remove-equipment-type'; typeId: string }
  | { type: 'rename-hive'; hiveId: string; name: string }
  | { type: 'rename-site'; siteId: string; name: string }
  | { type: 'move-hive'; hiveId: string; siteId: string; padId?: string }
  | { type: 'set-hive-pos'; hiveId: string; x: number; y: number }
  | { type: 'set-pad-pos'; padId: string; x: number; y: number }
  | { type: 'set-shape'; siteId: string; shape: Point[] }
  | { type: 'set-brood'; hiveId: string; count: 0 | 1 | 2 }
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
      return {
        ...state,
        equipmentTypes: [
          ...state.equipmentTypes,
          {
            id: action.id,
            name,
            shortName: name,
            group: 'custom',
            builtIn: false,
          },
        ],
        owned: { ...state.owned, [action.id]: 0 },
      }
    }
    case 'remove-equipment-type': {
      const type = state.equipmentTypes.find((item) => item.id === action.typeId)
      if (!type || type.builtIn) return state
      const used = state.hives.some((hive) =>
        hive.stack.some((layer) => layer.typeId === action.typeId),
      )
      if (used) return state
      const owned = { ...state.owned }
      delete owned[action.typeId]
      return {
        ...state,
        equipmentTypes: state.equipmentTypes.filter(
          (item) => item.id !== action.typeId,
        ),
        owned,
      }
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
          action.count,
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
      const name = defaultHiveName(action.siteId, action.kind, state.hives)
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
    case 'reset-seed':
      return createSeedState()
  }
}

const DEEP_BOX_ID = 'deep-box'
const SHALLOW_BOX_ID = 'shallow-box'
const BOTTOM_BOARD_ID = 'bottom-board'
const INNER_COVER_ID = 'inner-cover'
