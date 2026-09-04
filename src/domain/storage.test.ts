import { describe, expect, it } from 'vitest'
import {
  DEEP_BOX,
  DEEP_USED_FRAME,
  METAL_LID,
  SHALLOW_FRAME,
  UNBUILT_SPRING_FRAME,
  WAXED_SPRING_FRAME,
  WOODEN_LID,
} from './equipment.ts'
import { unusedForType } from './inventory.ts'
import { reducer } from './reducer.ts'
import { createSeedState, HOME_YARD, L_YARD_GAP_PAD } from './seed.ts'
import { migrateState } from './storage.ts'

describe('storage migrate', () => {
  it('marks only the original ten garage pads as site-locked', () => {
    const seed = createSeedState()
    const v1 = {
      ...seed,
      version: 1 as const,
      pads: seed.pads.map((pad) => ({
        id: pad.id,
        name: pad.name,
        siteId: pad.siteId,
        size: pad.size,
        x: pad.x,
        y: pad.y,
        occupiedHiveId: pad.occupiedHiveId,
      })),
    }
    const next = migrateState(v1)
    expect(next?.version).toBe(9)
    expect(next?.pads.filter((pad) => pad.lockedBottomAndLid)).toHaveLength(10)
    expect(unusedForType(next!, WOODEN_LID)).toBe(0)
    expect(unusedForType(next!, METAL_LID)).toBe(5)
  })

  it('assigns seven L-yard metal lids and the frame lots when upgrading older data', () => {
    const seed = createSeedState()
    const v2 = {
      ...seed,
      version: 2 as const,
      owned: { ...seed.owned, [METAL_LID]: 0 },
      hives: seed.hives.map((hive) =>
        hive.kind === 'full-size' && hive.siteId === 'home-yard'
          ? { ...hive, stack: [] }
          : hive,
      ),
    }
    const next = migrateState(v2)
    expect(next?.owned[METAL_LID]).toBe(12)
    expect(unusedForType(next!, METAL_LID)).toBe(5)
    const full = next!.hives.filter(
      (hive) => hive.kind === 'full-size' && hive.siteId === 'home-yard',
    )
    expect(full).toHaveLength(7)
    expect(
      full.every((hive) =>
        hive.stack.some((layer) => layer.typeId === METAL_LID),
      ),
    ).toBe(true)
    expect(
      next!.hives
        .filter((hive) => hive.kind !== 'full-size')
        .every((hive) => !hive.stack.some((layer) => layer.role === 'lid')),
    ).toBe(true)
    expect(
      next!.hives.every(
        (hive) =>
          !hive.stack.some((layer) => layer.role === 'bottom') &&
          !hive.stack.some((layer) => layer.role === 'inner-cover'),
      ),
    ).toBe(true)
    expect(next?.owned['bottom-board']).toBe(2)
    expect(next?.owned['inner-cover']).toBe(2)
    expect(
      next?.pads.some(
        (pad) => pad.id === L_YARD_GAP_PAD.id && pad.siteId === HOME_YARD,
      ),
    ).toBe(true)
    expect(
      next?.hives.every((hive) => Array.isArray(hive.inspections)),
    ).toBe(true)
  })

  it('keeps existing owned counts and custom types when moving to v9', () => {
    const seed = createSeedState()
    const v7 = {
      ...seed,
      version: 7 as const,
      equipmentTypes: [
        ...seed.equipmentTypes.map((type) => ({
          id: type.id,
          name: type.name,
          shortName: type.shortName,
          group: type.id === METAL_LID ? 'parts' : type.group,
          builtIn: true,
        })),
        {
          id: 'custom-excluder',
          name: 'Queen excluder',
          shortName: 'Excluder',
          group: 'custom',
          builtIn: false,
        },
        {
          id: 'round-feeder',
          name: 'Round feeder',
          shortName: 'Round feeder',
          group: 'feeding',
          builtIn: true,
        },
      ],
      owned: {
        ...seed.owned,
        [DEEP_BOX]: 20,
        'custom-excluder': 3,
        'round-feeder': 0,
      },
    }
    const next = migrateState(v7)
    expect(next?.version).toBe(9)
    expect(next?.owned[DEEP_BOX]).toBe(20)
    expect(next?.owned['custom-excluder']).toBe(3)
    expect(next?.equipmentTypes.find((type) => type.id === METAL_LID)?.group).toBe(
      'tops-and-bottoms',
    )
    expect(next?.equipmentTypes.find((type) => type.id === DEEP_BOX)?.group).toBe(
      'hive-boxes',
    )
    expect(
      next?.equipmentTypes.find((type) => type.id === 'bottom-board')?.group,
    ).toBe('tops-and-bottoms')
    expect(
      next?.equipmentTypes.find((type) => type.id === 'custom-excluder')?.group,
    ).toBe('other')
    expect(next?.equipmentTypes.some((type) => type.id === 'round-feeder')).toBe(
      true,
    )
    expect(
      next?.equipmentTypes.find((type) => type.id === 'round-feeder')?.group,
    ).toBe('other')
    expect(
      next?.equipmentTypes.find((type) => type.id === DEEP_USED_FRAME)
        ?.frameTotal,
    ).toBe('deep')
    expect(
      next?.equipmentTypes.find((type) => type.id === WAXED_SPRING_FRAME)
        ?.frameTotal,
    ).toBeNull()
    expect(next?.equipmentTypes.every((type) => type.builtIn === false)).toBe(
      true,
    )
  })

  it('does not put a deleted starter type back on a v8 load', () => {
    const seed = createSeedState()
    const owned = { ...seed.owned }
    delete owned[SHALLOW_FRAME]
    const v8 = {
      ...seed,
      version: 8 as const,
      equipmentTypes: seed.equipmentTypes.filter(
        (type) => type.id !== SHALLOW_FRAME,
      ),
      owned,
    }
    const next = migrateState(v8)
    expect(next?.equipmentTypes.some((type) => type.id === SHALLOW_FRAME)).toBe(
      false,
    )
    expect(next?.owned[DEEP_BOX]).toBe(20)
    expect(next?.owned[SHALLOW_FRAME]).toBeUndefined()
  })

  it('puts v8 types into hive boxes, frames, tops and bottoms, or other', () => {
    const seed = createSeedState()
    const v8 = {
      ...seed,
      version: 8 as const,
      equipmentTypes: [
        {
          id: 'deep-box',
          name: 'Deep box (10-frame)',
          shortName: 'Deep box',
          group: 'boxes',
          builtIn: false,
        },
        {
          id: 'shallow-frame',
          name: 'Shallow frames',
          shortName: 'Shallow frames',
          group: 'frames',
          builtIn: false,
        },
        {
          id: 'bottom-board',
          name: 'Bottom board',
          shortName: 'Bottom board',
          group: 'other',
          builtIn: false,
        },
        {
          id: 'metal-lid',
          name: 'Metal lid',
          shortName: 'Metal lid',
          group: 'lids',
          builtIn: false,
        },
        {
          id: 'round-feeder',
          name: 'Round feeder',
          shortName: 'Round feeder',
          group: 'feeding',
          builtIn: false,
        },
        {
          id: 'custom-excluder',
          name: 'Queen excluder',
          shortName: 'Excluder',
          group: 'custom',
          builtIn: false,
        },
      ],
      owned: {
        [DEEP_BOX]: 20,
        [SHALLOW_FRAME]: 0,
        'bottom-board': 2,
        [METAL_LID]: 12,
        'round-feeder': 0,
        'custom-excluder': 3,
      },
    }
    const next = migrateState(v8)
    expect(next?.version).toBe(9)
    expect(next?.owned[DEEP_BOX]).toBe(20)
    expect(next?.owned['custom-excluder']).toBe(3)
    expect(next?.equipmentTypes.find((type) => type.id === DEEP_BOX)?.group).toBe(
      'hive-boxes',
    )
    expect(
      next?.equipmentTypes.find((type) => type.id === SHALLOW_FRAME)?.group,
    ).toBe('frames')
    expect(
      next?.equipmentTypes.find((type) => type.id === 'bottom-board')?.group,
    ).toBe('tops-and-bottoms')
    expect(next?.equipmentTypes.find((type) => type.id === METAL_LID)?.group).toBe(
      'tops-and-bottoms',
    )
    expect(
      next?.equipmentTypes.find((type) => type.id === 'round-feeder')?.group,
    ).toBe('other')
    expect(
      next?.equipmentTypes.find((type) => type.id === 'custom-excluder')?.group,
    ).toBe('other')
  })

  it('does not reshuffle a type Keith already filed after v9', () => {
    const seed = createSeedState()
    const v9 = {
      ...seed,
      version: 9 as const,
      equipmentTypes: [
        ...seed.equipmentTypes,
        {
          id: 'custom-excluder',
          name: 'Queen excluder',
          shortName: 'Excluder',
          group: 'hive-boxes' as const,
          builtIn: false,
          unit: '',
          frameTotal: null,
        },
      ],
      owned: { ...seed.owned, 'custom-excluder': 3 },
    }
    const next = migrateState(v9)
    expect(
      next?.equipmentTypes.find((type) => type.id === 'custom-excluder')?.group,
    ).toBe('hive-boxes')
    expect(next?.owned['custom-excluder']).toBe(3)
  })

  it('keeps a dragged type order when reloading v9 data', () => {
    const seed = createSeedState()
    const reordered = reducer(seed, {
      type: 'reorder-equipment',
      group: 'frames',
      typeId: DEEP_USED_FRAME,
      toIndex: 3,
    })
    const next = migrateState(JSON.parse(JSON.stringify(reordered)))
    expect(
      next?.equipmentTypes
        .filter((type) => type.group === 'frames')
        .map((type) => type.id),
    ).toEqual([
      WAXED_SPRING_FRAME,
      UNBUILT_SPRING_FRAME,
      SHALLOW_FRAME,
      DEEP_USED_FRAME,
    ])
    expect(next?.owned[DEEP_USED_FRAME]).toBe(50)
    expect(unusedForType(next!, DEEP_USED_FRAME)).toBe(50)
    expect(next?.owned[DEEP_BOX]).toBe(20)
  })
})
