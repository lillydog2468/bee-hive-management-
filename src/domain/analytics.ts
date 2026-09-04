import { unusedForType } from './inventory.ts'
import { OBSERVATION_FIELDS, type ObservationKey } from './inspection.ts'
import type { AppState, Inspection, QueenMarkColour } from './types.ts'

export type DatedInspection = {
  hiveId: string
  hiveName: string
  inspection: Inspection
}

export function allInspections(state: AppState): DatedInspection[] {
  const rows: DatedInspection[] = []
  for (const hive of state.hives) {
    for (const inspection of hive.inspections) {
      rows.push({ hiveId: hive.id, hiveName: hive.name, inspection })
    }
  }
  return rows.sort((a, b) => {
    if (a.inspection.date === b.inspection.date) {
      return b.inspection.id.localeCompare(a.inspection.id)
    }
    return a.inspection.date.localeCompare(b.inspection.date)
  })
}

export function observationCounts(
  rows: DatedInspection[],
): Record<ObservationKey, number> {
  const counts = {
    eggs: 0,
    larvae: 0,
    cappedBrood: 0,
    droneCells: 0,
    queenCells: 0,
  }
  for (const row of rows) {
    for (const field of OBSERVATION_FIELDS) {
      if (row.inspection[field.key]) counts[field.key] += 1
    }
  }
  return counts
}

export function queenStats(rows: DatedInspection[]): {
  seen: number
  notSeen: number
  markedYes: number
  markedNo: number
  markedUnknown: number
  colours: Record<QueenMarkColour, number>
} {
  const colours: Record<QueenMarkColour, number> = {
    white: 0,
    yellow: 0,
    red: 0,
    green: 0,
    blue: 0,
  }
  let seen = 0
  let notSeen = 0
  let markedYes = 0
  let markedNo = 0
  let markedUnknown = 0
  for (const row of rows) {
    if (row.inspection.queenSeen) seen += 1
    else notSeen += 1
    if (row.inspection.queenMarked === 'yes') markedYes += 1
    else if (row.inspection.queenMarked === 'no') markedNo += 1
    else markedUnknown += 1
    const colour = row.inspection.queenMarkColour
    if (row.inspection.queenMarked === 'yes' && colour) colours[colour] += 1
  }
  return { seen, notSeen, markedYes, markedNo, markedUnknown, colours }
}

export function syrupByDate(
  state: AppState,
): { date: string; litres: number }[] {
  const byDate = new Map<string, number>()
  for (const hive of state.hives) {
    for (const feeding of hive.feedings) {
      byDate.set(feeding.date, (byDate.get(feeding.date) ?? 0) + feeding.litres)
    }
  }
  return [...byDate.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, litres]) => ({ date, litres }))
}

export function hivesPerSite(
  state: AppState,
): { siteId: string; name: string; count: number }[] {
  return state.sites.map((site) => ({
    siteId: site.id,
    name: site.name,
    count: state.hives.filter((hive) => hive.siteId === site.id).length,
  }))
}

export function unusedSpotlight(state: AppState): { id: string; name: string; unused: number }[] {
  return state.equipmentTypes
    .map((type) => ({
      id: type.id,
      name: type.shortName,
      unused: unusedForType(state, type.id),
    }))
    .filter((row) => row.unused !== 0)
}
