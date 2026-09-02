import type { Hive, HiveKind, Pad, PadSize } from './types.ts'

function escapeRe(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function nextNumberedName(prefix: string, names: string[]): string {
  const re = new RegExp(`^${escapeRe(prefix)} (\\d+)$`)
  let max = 0
  for (const name of names) {
    const match = name.match(re)
    if (match) max = Math.max(max, Number(match[1]))
  }
  return `${prefix} ${max + 1}`
}

export function defaultHiveName(
  siteId: string,
  kind: HiveKind,
  hives: Hive[],
): string {
  const names = hives.map((hive) => hive.name)
  if (siteId === 'home-yard') {
    return kind === 'full-size'
      ? nextNumberedName('Yard', names)
      : nextNumberedName('Yard nuc', names)
  }
  if (siteId === 'garage') {
    return kind === 'full-size'
      ? nextNumberedName('Garage hive', names)
      : nextNumberedName('Garage nuc', names)
  }
  if (kind === 'full-size') return nextNumberedName('Far side hive', names)
  if (kind === 'nuc-5') {
    if (!names.includes('Far side nuc')) return 'Far side nuc'
    return nextNumberedName('Far side nuc', names)
  }
  return nextNumberedName('Far side nuc', names)
}

export function defaultPadName(size: PadSize, pads: Pad[]): string {
  const names = pads.map((pad) => pad.name)
  return size === 'nuc'
    ? nextNumberedName('Nuc pad', names)
    : nextNumberedName('Pad', names)
}

export function hiveKindLabel(kind: HiveKind): string {
  if (kind === 'full-size') return 'Full-size hive'
  if (kind === 'nuc-4') return '4-frame nuc'
  return '5-frame nuc'
}

export function padSizeLabel(size: PadSize): string {
  return size === 'nuc' ? 'Nuc pad' : 'Full-size pad'
}
