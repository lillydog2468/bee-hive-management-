import { describe, expect, it } from 'vitest'
import {
  DEEP_BOX,
  NUC_BOX_4,
  NUC_BOX_5,
  SHALLOW_BOX,
} from './equipment.ts'
import { inUseCount, tallyInUse, unusedCount, unusedForType } from './inventory.ts'
import { reducer } from './reducer.ts'
import { createSeedState, FAR_SIDE, GARAGE, HOME_YARD } from './seed.ts'

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

  it('seeds garage as empty pads, nucs on the left', () => {
    const state = createSeedState()
    expect(state.hives.filter((hive) => hive.siteId === GARAGE)).toHaveLength(0)
    const pads = state.pads.filter((pad) => pad.siteId === GARAGE)
    expect(pads.filter((pad) => pad.size === 'full-size')).toHaveLength(8)
    expect(pads.filter((pad) => pad.size === 'nuc')).toHaveLength(2)
    expect(pads.every((pad) => pad.occupiedHiveId === null)).toBe(true)
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

  it('does not treat garage pads as using kit', () => {
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

  it('moves a hive onto a garage pad and leaves the pad occupied', () => {
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
