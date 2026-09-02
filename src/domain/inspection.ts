import type {
  HiveKind,
  Inspection,
  QueenMarkColour,
  QueenMarked,
} from './types.ts'
import {
  DEEP_BOX,
  NUC_BOX_4,
  NUC_BOX_5,
  SHALLOW_BOX,
} from './equipment.ts'

export const QUEEN_MARK_COLOURS: QueenMarkColour[] = [
  'white',
  'yellow',
  'red',
  'green',
  'blue',
]

export const OBSERVATION_FIELDS = [
  { key: 'eggs', label: 'Eggs' },
  { key: 'larvae', label: 'Larvae' },
  { key: 'cappedBrood', label: 'Capped brood' },
  { key: 'droneCells', label: 'Drone cells' },
  { key: 'queenCells', label: 'Queen cells' },
] as const

export type ObservationKey = (typeof OBSERVATION_FIELDS)[number]['key']

export function sortInspectionsNewestFirst(
  inspections: Inspection[],
): Inspection[] {
  return [...inspections].sort((a, b) => {
    if (a.date === b.date) return b.id.localeCompare(a.id)
    return b.date.localeCompare(a.date)
  })
}

export function colourLabel(colour: QueenMarkColour): string {
  if (colour === 'white') return 'White'
  if (colour === 'yellow') return 'Yellow'
  if (colour === 'red') return 'Red'
  if (colour === 'green') return 'Green'
  return 'Blue'
}

export function markedLabel(marked: QueenMarked): string {
  if (marked === 'yes') return 'Marked'
  if (marked === 'no') return 'Not marked'
  return 'Unknown'
}

export function boxChoicesForHive(kind: HiveKind): { id: string; label: string }[] {
  if (kind === 'full-size') {
    return [
      { id: DEEP_BOX, label: 'Deep box' },
      { id: SHALLOW_BOX, label: 'Shallow box' },
    ]
  }
  if (kind === 'nuc-4') return [{ id: NUC_BOX_4, label: '4-frame nuc box' }]
  return [{ id: NUC_BOX_5, label: '5-frame nuc box' }]
}

export function isAllowedInspectionBox(kind: HiveKind, typeId: string): boolean {
  return boxChoicesForHive(kind).some((choice) => choice.id === typeId)
}
