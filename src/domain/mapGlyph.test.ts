import { describe, expect, it } from 'vitest'
import { fullSizeUsesNestedSquare, nucGlyphLineCount } from './mapGlyph.ts'

describe('map glyphs', () => {
  it('uses the nested-square large-hive mark for two or more deeps', () => {
    expect(fullSizeUsesNestedSquare(1)).toBe(false)
    expect(fullSizeUsesNestedSquare(2)).toBe(true)
    expect(fullSizeUsesNestedSquare(4)).toBe(true)
  })

  it('caps nuc line marks at three, matching Keith’s key', () => {
    expect(nucGlyphLineCount(1)).toBe(1)
    expect(nucGlyphLineCount(2)).toBe(2)
    expect(nucGlyphLineCount(3)).toBe(3)
    expect(nucGlyphLineCount(5)).toBe(3)
  })
})
