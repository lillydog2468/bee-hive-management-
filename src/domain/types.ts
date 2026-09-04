export type Point = { x: number; y: number }

export type LayerRole =
  | 'bottom'
  | 'brood'
  | 'nuc-box'
  | 'super'
  | 'inner-cover'
  | 'feeder-box'
  | 'feeder'
  | 'feeding-body'
  | 'lid'
  | 'extra'

export type HiveKind = 'full-size' | 'nuc-4' | 'nuc-5'

export type PadSize = 'full-size' | 'nuc'

export type EquipmentGroup =
  | 'hive-boxes'
  | 'frames'
  | 'tops-and-bottoms'
  | 'other'

export type FrameTotal = 'deep' | 'shallow' | null

export type EquipmentType = {
  id: string
  name: string
  shortName: string
  group: EquipmentGroup
  builtIn: boolean
  unit: string
  frameTotal: FrameTotal
}

export type StackLayer = {
  id: string
  typeId: string
  role: LayerRole
  /** Pad-owned kit that never enters the unused pool. */
  siteLocked?: boolean
}

export type Site = {
  id: string
  name: string
  summary: string
  lidTypeId: string | null
  shape: Point[]
}

export type FeedingEntry = {
  id: string
  date: string
  litres: number
}

export type QueenMarkColour = 'white' | 'yellow' | 'red' | 'green' | 'blue'

export type QueenMarked = 'yes' | 'no' | 'unknown'

export type Inspection = {
  id: string
  date: string
  strength: 1 | 2 | 3 | 4 | 5
  eggs: boolean
  larvae: boolean
  cappedBrood: boolean
  droneCells: boolean
  queenCells: boolean
  queenSeen: boolean
  queenMarked: QueenMarked
  queenMarkColour: QueenMarkColour | null
  notes: string
  addedBoxTypeId: string | null
  addedFrameTypeId: string | null
  addedFrameCount: number
  splitId: string | null
}

export type SplitRecord = {
  id: string
  date: string
  sourceHiveId: string
  sourceName: string
  destHiveId: string
  destName: string
  destPadId: string | null
  destSiteId: string
  destSiteName: string
}

export type Hive = {
  id: string
  name: string
  siteId: string
  kind: HiveKind
  stack: StackLayer[]
  x: number
  y: number
  padId: string | null
  feedings: FeedingEntry[]
  inspections: Inspection[]
}

export type Pad = {
  id: string
  name: string
  siteId: string
  size: PadSize
  x: number
  y: number
  occupiedHiveId: string | null
  /** This pad owns a bottom board and wooden lid that stay on this site. */
  lockedBottomAndLid: boolean
}

export type AppState = {
  version: 10
  appName: string
  equipmentTypes: EquipmentType[]
  owned: Record<string, number>
  sites: Site[]
  hives: Hive[]
  pads: Pad[]
  splits: SplitRecord[]
}

export type FeedingConfig = {
  feederBoxTypeId: 'deep-box' | 'shallow-box'
  feederTypeId: 'round-feeder' | 'feeding-jar'
  extraBodyTypeId: 'deep-box' | 'shallow-box'
}
