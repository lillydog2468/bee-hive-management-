import type { EquipmentGroup } from './domain/types.ts'
import { parseEquipmentGroup } from './domain/equipment.ts'

export type Route =
  | { page: 'unused' }
  | { page: 'stock'; typeId: string; group?: EquipmentGroup }
  | { page: 'sites' }
  | { page: 'site'; siteId: string }
  | { page: 'hives' }
  | { page: 'hive'; hiveId: string }
  | { page: 'inspections' }
  | { page: 'inspect'; hiveId: string }
  | { page: 'analytics' }
  | { page: 'more' }

export function parseHash(hash: string): Route {
  const path = hash.replace(/^#/, '').replace(/^\/+/, '')
  const parts = path.split('/').filter(Boolean)
  if (parts.length === 0 || parts[0] === 'unused') return { page: 'unused' }
  if (parts[0] === 'sites' && parts[1]) return { page: 'site', siteId: parts[1] }
  if (parts[0] === 'sites') return { page: 'sites' }
  if (parts[0] === 'hives' && parts[1]) return { page: 'hive', hiveId: parts[1] }
  if (parts[0] === 'hives') return { page: 'hives' }
  if (parts[0] === 'inspections' && parts[1]) {
    return { page: 'inspect', hiveId: parts[1] }
  }
  if (parts[0] === 'inspections') return { page: 'inspections' }
  if (parts[0] === 'analytics') return { page: 'analytics' }
  if (parts[0] === 'kit' && parts[1] === 'new') {
    return { page: 'stock', typeId: 'new', group: parseEquipmentGroup(parts[2]) }
  }
  if (parts[0] === 'kit' && parts[1]) return { page: 'stock', typeId: parts[1] }
  if (parts[0] === 'more') return { page: 'more' }
  return { page: 'unused' }
}

export function toHash(route: Route): string {
  switch (route.page) {
    case 'unused':
      return '#/unused'
    case 'stock':
      return route.typeId === 'new' && route.group
        ? `#/kit/new/${route.group}`
        : `#/kit/${route.typeId}`
    case 'sites':
      return '#/sites'
    case 'site':
      return `#/sites/${route.siteId}`
    case 'hives':
      return '#/hives'
    case 'hive':
      return `#/hives/${route.hiveId}`
    case 'inspections':
      return '#/inspections'
    case 'inspect':
      return `#/inspections/${route.hiveId}`
    case 'analytics':
      return '#/analytics'
    case 'more':
      return '#/more'
  }
}

export function navigate(route: Route): void {
  const next = toHash(route)
  if (window.location.hash !== next) {
    window.location.hash = next
  }
}
