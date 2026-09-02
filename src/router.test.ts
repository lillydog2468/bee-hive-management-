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
})
