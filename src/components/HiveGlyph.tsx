import {
  fullSizeUsesNestedSquare,
  nucGlyphLineCount,
} from '../domain/mapGlyph.ts'
import type { HiveKind } from '../domain/types.ts'

export function HiveGlyph({
  kind,
  boxCount,
  rotate = false,
  title,
}: {
  kind: HiveKind
  boxCount: number
  rotate?: boolean
  title?: string
}) {
  if (kind === 'full-size') {
    const two = fullSizeUsesNestedSquare(boxCount)
    return (
      <svg
        className="hive-glyph is-full"
        viewBox="0 0 32 32"
        aria-hidden={title ? undefined : true}
        role={title ? 'img' : undefined}
      >
        {title ? <title>{title}</title> : null}
        <rect
          x="2.5"
          y="2.5"
          width="27"
          height="27"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
        />
        {two ? (
          <rect
            x="9"
            y="9"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
          />
        ) : null}
      </svg>
    )
  }

  const lines = nucGlyphLineCount(boxCount)
  const gap = 6
  const start = 16 - ((lines - 1) * gap) / 2
  return (
    <svg
      className={rotate ? 'hive-glyph is-nuc is-along-path' : 'hive-glyph is-nuc'}
      viewBox="0 0 32 32"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
    >
      {title ? <title>{title}</title> : null}
      {Array.from({ length: lines }, (_, index) => (
        <line
          key={index}
          x1={start + index * gap}
          y1="6"
          x2={start + index * gap}
          y2="26"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="square"
        />
      ))}
    </svg>
  )
}
