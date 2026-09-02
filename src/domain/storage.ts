import { createSeedState, GARAGE } from './seed.ts'
import type { AppState, Pad } from './types.ts'

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

export function migrateState(parsed: LooseState): AppState | null {
  if (!Array.isArray(parsed.hives) || !Array.isArray(parsed.pads)) return null
  if (parsed.version !== 1 && parsed.version !== 2) return null
  return {
    ...parsed,
    version: 2,
    pads: parsed.pads.map(migratePad),
  }
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
