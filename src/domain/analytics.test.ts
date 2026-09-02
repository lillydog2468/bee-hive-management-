import { describe, expect, it } from 'vitest'
import { allInspections, observationCounts, syrupByDate } from './analytics.ts'
import { DEEP_USED_FRAME } from './equipment.ts'
import { reducer } from './reducer.ts'
import { createSeedState } from './seed.ts'

describe('analytics', () => {
  it('is empty until Keith logs inspections or syrup', () => {
    const state = createSeedState()
    expect(allInspections(state)).toEqual([])
    expect(syrupByDate(state)).toEqual([])
    expect(observationCounts([]).larvae).toBe(0)
  })

  it('counts larvae ticks from inspections he logged', () => {
    let state = createSeedState()
    state = reducer(state, {
      type: 'add-inspection',
      hiveId: 'hive-yard-1',
      id: 'insp-a',
      date: '2026-09-02',
      strength: 4,
      eggs: true,
      larvae: true,
      cappedBrood: false,
      droneCells: false,
      queenCells: false,
      queenSeen: true,
      queenMarked: 'unknown',
      queenMarkColour: null,
      notes: '',
      addedBoxTypeId: null,
      addedFrameTypeId: DEEP_USED_FRAME,
      addedFrameCount: 0,
      destPadId: null,
      splitId: 's',
      newHiveId: 'h',
    })
    const rows = allInspections(state)
    expect(rows).toHaveLength(1)
    expect(observationCounts(rows).larvae).toBe(1)
    expect(observationCounts(rows).cappedBrood).toBe(0)
  })
})
