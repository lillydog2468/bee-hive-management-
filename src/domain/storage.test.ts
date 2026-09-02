import { describe, expect, it } from 'vitest'
import { METAL_LID, WOODEN_LID } from './equipment.ts'
import { unusedForType } from './inventory.ts'
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
    expect(next?.version).toBe(6)
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
  })
})
