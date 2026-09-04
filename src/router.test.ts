import { describe, expect, it } from 'vitest'
import { parseHash, toHash } from './router.ts'

describe('router', () => {
  it('parses unused as home', () => {
    expect(parseHash('')).toEqual({ page: 'unused' })
    expect(parseHash('#/unused')).toEqual({ page: 'unused' })
  })

  it('round-trips site and hive routes', () => {
    expect(parseHash(toHash({ page: 'site', siteId: 'home-yard' }))).toEqual({
      page: 'site',
      siteId: 'home-yard',
    })
    expect(parseHash(toHash({ page: 'hive', hiveId: 'hive-yard-1' }))).toEqual({
      page: 'hive',
      hiveId: 'hive-yard-1',
    })
  })

  it('round-trips inspections routes', () => {
    expect(parseHash(toHash({ page: 'inspections' }))).toEqual({
      page: 'inspections',
    })
    expect(parseHash(toHash({ page: 'inspect', hiveId: 'hive-yard-1' }))).toEqual({
      page: 'inspect',
      hiveId: 'hive-yard-1',
    })
  })

  it('round-trips analytics', () => {
    expect(parseHash(toHash({ page: 'analytics' }))).toEqual({
      page: 'analytics',
    })
  })

  it('round-trips add-to-section kit routes', () => {
    expect(
      parseHash(toHash({ page: 'stock', typeId: 'new', group: 'hive-boxes' })),
    ).toEqual({ page: 'stock', typeId: 'new', group: 'hive-boxes' })
    expect(parseHash('#/kit/new/frames')).toEqual({
      page: 'stock',
      typeId: 'new',
      group: 'frames',
    })
    expect(parseHash('#/kit/new/tops-and-bottoms')).toEqual({
      page: 'stock',
      typeId: 'new',
      group: 'tops-and-bottoms',
    })
    expect(parseHash('#/kit/new/other')).toEqual({
      page: 'stock',
      typeId: 'new',
      group: 'other',
    })
  })
})
