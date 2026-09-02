import { describe, expect, it } from 'vitest'
import { WOODEN_LID } from './equipment.ts'
import { unusedForType } from './inventory.ts'
import { createSeedState } from './seed.ts'
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
    expect(next?.version).toBe(2)
    expect(next?.pads.filter((pad) => pad.lockedBottomAndLid)).toHaveLength(10)
    expect(unusedForType(next!, WOODEN_LID)).toBe(0)
  })
})
