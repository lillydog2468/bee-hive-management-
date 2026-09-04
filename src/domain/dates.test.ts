import { describe, expect, it } from 'vitest'
import { formatLitres, formatUkDate } from './dates.ts'

describe('dates and litres', () => {
  it('formats litres in British English', () => {
    expect(formatLitres(1)).toBe('1 litre')
    expect(formatLitres(2)).toBe('2 litres')
    expect(formatLitres(0.5)).toBe('0.5 litres')
  })

  it('formats ISO dates in British English', () => {
    expect(formatUkDate('2026-09-02')).toBe('2 September 2026')
  })
})
