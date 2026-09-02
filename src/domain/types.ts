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
  | 'boxes'
  | 'frames'
  | 'parts'
  | 'feeding'
  | 'custom'

export type EquipmentType = {
  id: string
  name: string
  shortName: string
  group: EquipmentGroup
  builtIn: boolean
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

export type Hive = {
  id: string
  name: string
  siteId: string
  kind: HiveKind
  stack: StackLayer[]
  x: number
  y: number
  padId: string | null
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
  version: 3
  appName: string
  equipmentTypes: EquipmentType[]
  owned: Record<string, number>
  sites: Site[]
  hives: Hive[]
  pads: Pad[]
}

export type FeedingConfig = {
  feederBoxTypeId: 'deep-box' | 'shallow-box'
  feederTypeId: 'round-feeder' | 'feeding-jar'
  extraBodyTypeId: 'deep-box' | 'shallow-box'
}
