import { describe, expect, it } from 'vitest'
import {
  BOTTOM_BOARD,
  DEEP_BOX,
  DEEP_USED_FRAME,
  INNER_COVER,
  METAL_LID,
  NUC_BOX_4,
  NUC_BOX_5,
  SHALLOW_BOX,
  SHALLOW_FRAME,
  UNBUILT_SPRING_FRAME,
  WAXED_SPRING_FRAME,
  WOODEN_LID,
  YARD_FULL_SIZE_IDS,
} from './equipment.ts'
import { inUseCount, tallyInUse, unusedCount, unusedForType } from './inventory.ts'
import { reducer } from './reducer.ts'
import { hiveNeedsLidChoice } from './requiredParts.ts'
import { createSeedState, FAR_SIDE, GARAGE, HOME_YARD, L_YARD_PLACES } from './seed.ts'
import { displayStack, hivePad } from './siteLocked.ts'
import { countRole } from './stack.ts'

function roles(hive: { stack: { role: string }[] }): string[] {
  return hive.stack.map((layer) => layer.role)
}

describe('seed', () => {
  it('starts with 20 owned deeps; 12 are on L-yard brood, so 8 unused', () => {
    const state = createSeedState()
    expect(state.owned[DEEP_BOX]).toBe(20)
    expect(unusedForType(state, SHALLOW_BOX)).toBe(20)
    expect(tallyInUse(state.hives)[DEEP_BOX]).toBe(12)
    expect(unusedForType(state, DEEP_BOX)).toBe(8)
  })

  it('puts 5 spare metal lids in unused and 7 on L-yard full-size hives', () => {
    const state = createSeedState()
    expect(state.owned[METAL_LID]).toBe(12)
    expect(tallyInUse(state.hives)[METAL_LID]).toBe(7)
    expect(unusedForType(state, METAL_LID)).toBe(5)
    for (const id of YARD_FULL_SIZE_IDS) {
      const hive = state.hives.find((item) => item.id === id)
      expect(hive?.stack.some((layer) => layer.typeId === METAL_LID)).toBe(true)
      expect(hive?.stack.some((layer) => layer.role === 'bottom')).toBe(false)
      expect(hive?.stack.some((layer) => layer.role === 'inner-cover')).toBe(
        false,
      )
    }
  })

  it('puts 2 spare bottoms and 2 spare inner covers in unused without inventing in-use', () => {
    const state = createSeedState()
    expect(state.owned[BOTTOM_BOARD]).toBe(2)
    expect(state.owned[INNER_COVER]).toBe(2)
    expect(tallyInUse(state.hives)[BOTTOM_BOARD] ?? 0).toBe(0)
    expect(tallyInUse(state.hives)[INNER_COVER] ?? 0).toBe(0)
    expect(unusedForType(state, BOTTOM_BOARD)).toBe(2)
    expect(unusedForType(state, INNER_COVER)).toBe(2)
    for (const hive of state.hives) {
      expect(hive.stack.some((layer) => layer.role === 'bottom')).toBe(false)
      expect(hive.stack.some((layer) => layer.role === 'inner-cover')).toBe(
        false,
      )
    }
  })

  it('does not invent lids for outdoor nucs or the far-side nuc', () => {
    const state = createSeedState()
    const nucs = state.hives.filter(
      (hive) => hive.kind === 'nuc-4' || hive.kind === 'nuc-5',
    )
    expect(nucs).toHaveLength(7)
    for (const hive of nucs) {
      expect(hive.stack.some((layer) => layer.role === 'lid')).toBe(false)
    }
  })

  it('tracks deep used frames and two mixed spring lots without inventing a split', () => {
    const state = createSeedState()
    expect(state.owned[DEEP_USED_FRAME]).toBe(50)
    expect(state.owned[WAXED_SPRING_FRAME]).toBe(50)
    expect(state.owned[UNBUILT_SPRING_FRAME]).toBe(50)
    expect(unusedForType(state, DEEP_USED_FRAME)).toBe(50)
    expect(unusedForType(state, WAXED_SPRING_FRAME)).toBe(50)
    expect(unusedForType(state, UNBUILT_SPRING_FRAME)).toBe(50)
    expect(state.owned[SHALLOW_FRAME]).toBe(0)
    expect(unusedForType(state, SHALLOW_FRAME)).toBe(0)
  })

  it('starts remaining built-in types at owned 0', () => {
    const state = createSeedState()
    const seeded = new Set([
      DEEP_BOX,
      SHALLOW_BOX,
      METAL_LID,
      BOTTOM_BOARD,
      INNER_COVER,
      DEEP_USED_FRAME,
      WAXED_SPRING_FRAME,
      UNBUILT_SPRING_FRAME,
    ])
    for (const type of state.equipmentTypes) {
      if (seeded.has(type.id)) continue
      expect(state.owned[type.id]).toBe(0)
    }
  })

  it('seeds L-yard box counts from Keith’s drawing', () => {
    const state = createSeedState()
    const home = state.hives.filter((hive) => hive.siteId === HOME_YARD)
    expect(home).toHaveLength(13)
    const full = home.filter((hive) => hive.kind === 'full-size')
    const nucs = home.filter((hive) => hive.kind === 'nuc-4')
    expect(full).toHaveLength(7)
    expect(nucs).toHaveLength(6)
    expect(full.filter((hive) => countRole(hive.stack, 'brood') === 1)).toHaveLength(2)
    expect(full.filter((hive) => countRole(hive.stack, 'brood') === 2)).toHaveLength(5)
    expect(nucs.filter((hive) => countRole(hive.stack, 'nuc-box') === 3)).toHaveLength(5)
    expect(nucs.filter((hive) => countRole(hive.stack, 'nuc-box') === 2)).toHaveLength(1)
    expect(unusedForType(state, NUC_BOX_4)).toBe(-17)
    for (const [id, place] of Object.entries(L_YARD_PLACES)) {
      const hive = state.hives.find((item) => item.id === id)
      expect(hive?.x).toBe(place.x)
      expect(hive?.y).toBe(place.y)
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

  it('seeds the far-side 5-frame nuc with two nuc boxes', () => {
    const state = createSeedState()
    const hive = state.hives.find((item) => item.id === 'hive-far-side-nuc')
    expect(hive).toBeDefined()
    expect(hive?.siteId).toBe(FAR_SIDE)
    expect(hive?.kind).toBe('nuc-5')
    expect(hive?.name).toBe('Far side nuc')
    expect(hive?.stack.map((layer) => layer.typeId)).toEqual([
      NUC_BOX_5,
      NUC_BOX_5,
    ])
    expect(tallyInUse(state.hives)[NUC_BOX_5]).toBe(2)
    expect(unusedForType(state, NUC_BOX_5)).toBe(-2)
    expect(unusedForType(state, NUC_BOX_4)).toBe(-17)
    expect(hiveNeedsLidChoice(hive!, hivePad(state, hive!))).toBe(true)
  })

  it('does not invent extra equipment types', () => {
    const state = createSeedState()
    expect(state.equipmentTypes.map((type) => type.id)).toEqual([
      'deep-box',
      'shallow-box',
      'nuc-box-4',
      'nuc-box-5',
      'deep-used-frame',
      'waxed-spring-frame',
      'unbuilt-spring-frame',
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
    expect(unusedForType(state, DEEP_BOX)).toBe(8)
    state = reducer(state, { type: 'set-brood', hiveId: 'hive-yard-1', count: 2 })
    expect(unusedForType(state, DEEP_BOX)).toBe(7)
    expect(inUseCount(tallyInUse(state.hives), DEEP_BOX)).toBe(13)
    state = reducer(state, { type: 'clear-stack', hiveId: 'hive-yard-1' })
    expect(unusedForType(state, DEEP_BOX)).toBe(9)
    expect(roles(state.hives.find((item) => item.id === 'hive-yard-1')!)).toEqual([
      'lid',
    ])
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
    expect(state.owned[WOODEN_LID]).toBe(0)
    expect(unusedForType(state, WOODEN_LID)).toBe(0)
    expect(tallyInUse(state.hives)[WOODEN_LID] ?? 0).toBe(0)
    const locked = state.pads.filter((pad) => pad.lockedBottomAndLid)
    expect(locked).toHaveLength(10)
  })

  it('does not treat garage pad kit as unused-pool in-use', () => {
    const state = createSeedState()
    expect(Object.keys(tallyInUse(state.hives)).sort()).toEqual([
      DEEP_BOX,
      METAL_LID,
      NUC_BOX_4,
      NUC_BOX_5,
    ])
  })
})

describe('reducer', () => {
  it('adjusts owned stock without inventing other counts', () => {
    let state = createSeedState()
    state = reducer(state, { type: 'set-owned', typeId: DEEP_BOX, owned: 22 })
    expect(state.owned[DEEP_BOX]).toBe(22)
    expect(state.owned[SHALLOW_BOX]).toBe(20)
    expect(unusedForType(state, DEEP_BOX)).toBe(10)
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
    expect(hive?.stack.some((layer) => layer.role === 'inner-cover')).toBe(false)
    expect(unusedForType(state, WOODEN_LID)).toBe(0)
    expect(unusedForType(state, METAL_LID)).toBe(6)
    expect(tallyInUse(state.hives)[BOTTOM_BOARD] ?? 0).toBe(0)
    const shown = displayStack(hive!, hivePad(state, hive!))
    expect(shown.map((layer) => layer.typeId)).toEqual([
      BOTTOM_BOARD,
      DEEP_BOX,
      WOODEN_LID,
    ])
    expect(shown.find((layer) => layer.role === 'bottom')?.siteLocked).toBe(true)
    expect(shown.find((layer) => layer.role === 'lid')?.siteLocked).toBe(true)
    expect(shown.find((layer) => layer.role === 'inner-cover')?.siteLocked).toBeUndefined()
  })

  it('returns an L-yard metal lid to unused when that hive sits on a garage pad', () => {
    let state = createSeedState()
    expect(unusedForType(state, METAL_LID)).toBe(5)
    state = reducer(state, {
      type: 'place-hive-on-pad',
      hiveId: 'hive-yard-1',
      padId: 'pad-garage-1',
    })
    const hive = state.hives.find((item) => item.id === 'hive-yard-1')
    expect(hive?.stack.some((layer) => layer.typeId === METAL_LID)).toBe(false)
    expect(unusedForType(state, METAL_LID)).toBe(6)
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
    expect(tallyInUse(state.hives)[BOTTOM_BOARD] ?? 0).toBe(0)
    expect(unusedForType(state, WOODEN_LID)).toBe(0)
  })

  it('restores a metal lid when an L-yard full-size hive leaves a garage pad', () => {
    let state = createSeedState()
    state = reducer(state, {
      type: 'place-hive-on-pad',
      hiveId: 'hive-yard-1',
      padId: 'pad-garage-1',
    })
    expect(unusedForType(state, METAL_LID)).toBe(6)
    state = reducer(state, {
      type: 'move-hive',
      hiveId: 'hive-yard-1',
      siteId: HOME_YARD,
    })
    const hive = state.hives.find((item) => item.id === 'hive-yard-1')
    expect(hive?.padId).toBeNull()
    expect(hive?.stack.map((layer) => layer.typeId)).toEqual([
      DEEP_BOX,
      METAL_LID,
    ])
    expect(unusedForType(state, METAL_LID)).toBe(5)
    expect(unusedForType(state, WOODEN_LID)).toBe(0)
  })

  it('will not let required hive parts be toggled off', () => {
    let state = createSeedState()
    for (const part of ['bottom', 'inner-cover', 'lid'] as const) {
      state = reducer(state, {
        type: 'toggle-part',
        hiveId: 'hive-yard-1',
        part,
        on: false,
      })
    }
    const hive = state.hives.find((item) => item.id === 'hive-yard-1')
    expect(hive?.stack.map((layer) => layer.typeId)).toEqual([
      DEEP_BOX,
      METAL_LID,
    ])
  })

  it('lets a hive take a spare bottom without inventing extra stock', () => {
    let state = createSeedState()
    expect(unusedForType(state, BOTTOM_BOARD)).toBe(2)
    state = reducer(state, {
      type: 'toggle-part',
      hiveId: 'hive-yard-1',
      part: 'bottom',
      on: true,
    })
    expect(unusedForType(state, BOTTOM_BOARD)).toBe(1)
    state = reducer(state, {
      type: 'toggle-part',
      hiveId: 'hive-yard-1',
      part: 'bottom',
      on: false,
    })
    expect(unusedForType(state, BOTTOM_BOARD)).toBe(1)
  })

  it('lets a nuc choose a lid without inventing one at seed', () => {
    let state = createSeedState()
    const nuc = state.hives.find((item) => item.id === 'hive-yard-nuc-1')
    expect(nuc?.stack.some((layer) => layer.role === 'lid')).toBe(false)
    expect(unusedForType(state, METAL_LID)).toBe(5)
    state = reducer(state, {
      type: 'toggle-part',
      hiveId: 'hive-yard-nuc-1',
      part: 'lid',
      on: true,
      lidTypeId: METAL_LID,
    })
    const next = state.hives.find((item) => item.id === 'hive-yard-nuc-1')
    expect(next?.stack.some((layer) => layer.typeId === METAL_LID)).toBe(true)
    expect(unusedForType(state, METAL_LID)).toBe(4)
    state = reducer(state, {
      type: 'toggle-part',
      hiveId: 'hive-yard-nuc-1',
      part: 'lid',
      on: false,
    })
    expect(
      state.hives
        .find((item) => item.id === 'hive-yard-nuc-1')
        ?.stack.some((layer) => layer.role === 'lid'),
    ).toBe(true)
  })

  it('gives a new L-yard full-size hive the three required parts with a metal lid', () => {
    let state = createSeedState()
    state = reducer(state, {
      type: 'add-hive',
      id: 'hive-new-full',
      siteId: HOME_YARD,
      kind: 'full-size',
      x: 40,
      y: 40,
    })
    const hive = state.hives.find((item) => item.id === 'hive-new-full')
    expect(hive?.stack.map((layer) => layer.typeId)).toEqual([METAL_LID])
    expect(unusedForType(state, METAL_LID)).toBe(4)
    expect(unusedForType(state, BOTTOM_BOARD)).toBe(2)
    expect(unusedForType(state, INNER_COVER)).toBe(2)
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
    expect(unusedForType(state, DEEP_BOX)).toBe(7)
    expect(unusedForType(state, 'round-feeder')).toBe(-1)
    state = reducer(state, {
      type: 'set-feeding',
      hiveId: 'hive-yard-1',
      feeding: null,
    })
    expect(unusedForType(state, SHALLOW_BOX)).toBe(20)
    expect(unusedForType(state, DEEP_BOX)).toBe(8)
  })
})
