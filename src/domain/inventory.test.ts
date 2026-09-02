import { describe, expect, it } from 'vitest'
import {
  BOTTOM_BOARD,
  DEEP_BOX,
  METAL_LID,
  NUC_BOX_4,
  NUC_BOX_5,
  SHALLOW_BOX,
  WOODEN_LID,
} from './equipment.ts'
import { inUseCount, tallyInUse, unusedCount, unusedForType } from './inventory.ts'
import { reducer } from './reducer.ts'
import { createSeedState, FAR_SIDE, GARAGE, HOME_YARD } from './seed.ts'
import { displayStack, hivePad } from './siteLocked.ts'

describe('seed', () => {
  it('starts with 20 unused deeps and 20 unused shallows', () => {
    const state = createSeedState()
    expect(unusedForType(state, DEEP_BOX)).toBe(20)
    expect(unusedForType(state, SHALLOW_BOX)).toBe(20)
    expect(state.owned[DEEP_BOX]).toBe(20)
    expect(state.owned[SHALLOW_BOX]).toBe(20)
  })

  it('starts every other built-in type at owned 0', () => {
    const state = createSeedState()
    for (const type of state.equipmentTypes) {
      if (type.id === DEEP_BOX || type.id === SHALLOW_BOX) continue
      expect(state.owned[type.id]).toBe(0)
    }
  })

  it('does not assign boxes to the home-yard hives', () => {
    const state = createSeedState()
    const home = state.hives.filter((hive) => hive.siteId === HOME_YARD)
    expect(home).toHaveLength(13)
    expect(home.filter((hive) => hive.kind === 'full-size')).toHaveLength(7)
    expect(home.filter((hive) => hive.kind === 'nuc-4')).toHaveLength(6)
    for (const hive of home) {
      expect(hive.stack).toEqual([])
    }
  })

  it('seeds garage as empty pads with site-locked bottoms and wooden lids', () => {
    const state = createSeedState()
    expect(state.hives.filter((hive) => hive.siteId === GARAGE)).toHaveLength(0)
    const pads = state.pads.filter((pad) => pad.siteId === GARAGE)
    expect(pads.filter((pad) => pad.size === 'full-size')).toHaveLength(8)
    expect(pads.filter((pad) => pad.size === 'nuc')).toHaveLength(2)
    expect(pads.every((pad) => pad.occupiedHiveId === null)).toBe(true)
    expect(pads.every((pad) => pad.lockedBottomAndLid)).toBe(true)
    const nucXs = pads.filter((pad) => pad.size === 'nuc').map((pad) => pad.x)
    const fullXs = pads.filter((pad) => pad.size === 'full-size').map((pad) => pad.x)
    expect(Math.max(...nucXs)).toBeLessThan(Math.min(...fullXs))
  })

  it('seeds the far-side 5-frame nuc with two nuc boxes only', () => {
    const state = createSeedState()
    const hive = state.hives.find((item) => item.id === 'hive-far-side-nuc')
    expect(hive).toBeDefined()
    expect(hive?.siteId).toBe(FAR_SIDE)
    expect(hive?.kind).toBe('nuc-5')
    expect(hive?.name).toBe('Far side nuc')
    expect(hive?.stack.map((layer) => layer.typeId)).toEqual([NUC_BOX_5, NUC_BOX_5])
    expect(tallyInUse(state.hives)[NUC_BOX_5]).toBe(2)
    expect(unusedForType(state, NUC_BOX_5)).toBe(-2)
    expect(unusedForType(state, NUC_BOX_4)).toBe(0)
  })

  it('does not invent extra equipment types', () => {
    const state = createSeedState()
    expect(state.equipmentTypes.map((type) => type.id)).toEqual([
      'deep-box',
      'shallow-box',
      'nuc-box-4',
      'nuc-box-5',
      'deep-frame',
      'shallow-frame',
      'bottom-board',
      'inner-cover',
      'metal-lid',
      'wooden-lid',
      'round-feeder',
      'feeding-jar',
    ])
  })
})

describe('unused accounting', () => {
  it('unused is owned minus kit on hive stacks', () => {
    expect(unusedCount(20, 2)).toBe(18)
    expect(unusedCount(0, 2)).toBe(-2)
  })

  it('assigning brood removes deeps from unused; clearing returns them', () => {
    let state = createSeedState()
    state = reducer(state, { type: 'set-brood', hiveId: 'hive-yard-1', count: 2 })
    expect(unusedForType(state, DEEP_BOX)).toBe(18)
    expect(inUseCount(tallyInUse(state.hives), DEEP_BOX)).toBe(2)
    state = reducer(state, { type: 'clear-stack', hiveId: 'hive-yard-1' })
    expect(unusedForType(state, DEEP_BOX)).toBe(20)
  })

  it('adding a super uses a shallow; removing it returns it', () => {
    let state = createSeedState()
    state = reducer(state, { type: 'set-supers', hiveId: 'hive-yard-1', count: 1 })
    expect(unusedForType(state, SHALLOW_BOX)).toBe(19)
    state = reducer(state, { type: 'set-supers', hiveId: 'hive-yard-1', count: 0 })
    expect(unusedForType(state, SHALLOW_BOX)).toBe(20)
  })

  it('removing the far-side hive returns its two nuc boxes', () => {
    let state = createSeedState()
    state = reducer(state, { type: 'remove-hive', hiveId: 'hive-far-side-nuc' })
    expect(unusedForType(state, NUC_BOX_5)).toBe(0)
    expect(tallyInUse(state.hives)[NUC_BOX_5] ?? 0).toBe(0)
  })

  it('does not put garage pad bottoms or wooden lids in unused', () => {
    const state = createSeedState()
    expect(state.owned[BOTTOM_BOARD]).toBe(0)
    expect(state.owned[WOODEN_LID]).toBe(0)
    expect(unusedForType(state, BOTTOM_BOARD)).toBe(0)
    expect(unusedForType(state, WOODEN_LID)).toBe(0)
    expect(tallyInUse(state.hives)[BOTTOM_BOARD] ?? 0).toBe(0)
    expect(tallyInUse(state.hives)[WOODEN_LID] ?? 0).toBe(0)
    const locked = state.pads.filter((pad) => pad.lockedBottomAndLid)
    expect(locked).toHaveLength(10)
  })

  it('does not treat garage pad kit as unused-pool in-use', () => {
    const state = createSeedState()
    expect(Object.keys(tallyInUse(state.hives)).sort()).toEqual([NUC_BOX_5])
  })
})

describe('reducer', () => {
  it('adjusts owned stock without inventing other counts', () => {
    let state = createSeedState()
    state = reducer(state, { type: 'set-owned', typeId: DEEP_BOX, owned: 22 })
    expect(state.owned[DEEP_BOX]).toBe(22)
    expect(state.owned[SHALLOW_BOX]).toBe(20)
    expect(unusedForType(state, DEEP_BOX)).toBe(22)
  })

  it('adds a custom type at owned 0', () => {
    let state = createSeedState()
    state = reducer(state, {
      type: 'add-equipment-type',
      id: 'custom-1',
      name: 'Queen excluder',
    })
    expect(state.owned['custom-1']).toBe(0)
    expect(unusedForType(state, 'custom-1')).toBe(0)
  })

  it('moves a hive onto a garage pad without taking pad kit from unused', () => {
    let state = createSeedState()
    state = reducer(state, {
      type: 'place-hive-on-pad',
      hiveId: 'hive-yard-1',
      padId: 'pad-garage-1',
    })
    const hive = state.hives.find((item) => item.id === 'hive-yard-1')
    const pad = state.pads.find((item) => item.id === 'pad-garage-1')
    expect(hive?.siteId).toBe(GARAGE)
    expect(hive?.padId).toBe('pad-garage-1')
    expect(pad?.occupiedHiveId).toBe('hive-yard-1')
    expect(hive?.stack.some((layer) => layer.role === 'bottom')).toBe(false)
    expect(hive?.stack.some((layer) => layer.role === 'lid')).toBe(false)
    expect(unusedForType(state, BOTTOM_BOARD)).toBe(0)
    expect(unusedForType(state, WOODEN_LID)).toBe(0)
    const shown = displayStack(hive!, hivePad(state, hive!))
    expect(shown.map((layer) => layer.typeId)).toEqual([BOTTOM_BOARD, WOODEN_LID])
    expect(shown.every((layer) => layer.siteLocked)).toBe(true)
  })

  it('returns a pool lid to unused when a hive sits on a garage pad', () => {
    let state = createSeedState()
    state = reducer(state, {
      type: 'toggle-part',
      hiveId: 'hive-yard-1',
      part: 'lid',
      on: true,
      lidTypeId: METAL_LID,
    })
    expect(unusedForType(state, METAL_LID)).toBe(-1)
    state = reducer(state, {
      type: 'place-hive-on-pad',
      hiveId: 'hive-yard-1',
      padId: 'pad-garage-1',
    })
    const hive = state.hives.find((item) => item.id === 'hive-yard-1')
    expect(hive?.stack.some((layer) => layer.typeId === METAL_LID)).toBe(false)
    expect(unusedForType(state, METAL_LID)).toBe(0)
    expect(unusedForType(state, WOODEN_LID)).toBe(0)
  })

  it('does not let garage pad bottoms or lids be toggled into unused', () => {
    let state = createSeedState()
    state = reducer(state, {
      type: 'place-hive-on-pad',
      hiveId: 'hive-yard-1',
      padId: 'pad-garage-1',
    })
    state = reducer(state, {
      type: 'toggle-part',
      hiveId: 'hive-yard-1',
      part: 'bottom',
      on: false,
    })
    state = reducer(state, {
      type: 'toggle-part',
      hiveId: 'hive-yard-1',
      part: 'lid',
      on: false,
    })
    const hive = state.hives.find((item) => item.id === 'hive-yard-1')
    const shown = displayStack(hive!, hivePad(state, hive!))
    expect(shown.some((layer) => layer.role === 'bottom' && layer.siteLocked)).toBe(
      true,
    )
    expect(shown.some((layer) => layer.typeId === WOODEN_LID && layer.siteLocked)).toBe(
      true,
    )
    expect(unusedForType(state, BOTTOM_BOARD)).toBe(0)
    expect(unusedForType(state, WOODEN_LID)).toBe(0)
  })

  it('does not invent extra locked kit when adding a garage pad', () => {
    let state = createSeedState()
    state = reducer(state, {
      type: 'add-pad',
      id: 'pad-extra',
      siteId: GARAGE,
      size: 'full-size',
      x: 70,
      y: 40,
    })
    const extra = state.pads.find((pad) => pad.id === 'pad-extra')
    expect(extra?.lockedBottomAndLid).toBe(false)
    expect(state.pads.filter((pad) => pad.lockedBottomAndLid)).toHaveLength(10)
    expect(unusedForType(state, WOODEN_LID)).toBe(0)
  })

  it('feeding assigns the empty box, feeder and extra body', () => {
    let state = createSeedState()
    state = reducer(state, {
      type: 'set-feeding',
      hiveId: 'hive-yard-1',
      feeding: {
        feederBoxTypeId: 'shallow-box',
        feederTypeId: 'round-feeder',
        extraBodyTypeId: 'deep-box',
      },
    })
    expect(unusedForType(state, SHALLOW_BOX)).toBe(19)
    expect(unusedForType(state, DEEP_BOX)).toBe(19)
    expect(unusedForType(state, 'round-feeder')).toBe(-1)
    state = reducer(state, {
      type: 'set-feeding',
      hiveId: 'hive-yard-1',
      feeding: null,
    })
    expect(unusedForType(state, SHALLOW_BOX)).toBe(20)
    expect(unusedForType(state, DEEP_BOX)).toBe(20)
  })
})
