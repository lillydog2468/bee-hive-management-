import type { FeedingConfig, LayerRole, StackLayer } from './types.ts'
import { DEEP_BOX } from './equipment.ts'

export type IdFactory = () => string

export const ROLE_ORDER: LayerRole[] = [
  'bottom',
  'brood',
  'nuc-box',
  'super',
  'inner-cover',
  'feeder-box',
  'feeder',
  'feeding-body',
  'lid',
  'extra',
]

const ROLE_INDEX = new Map(ROLE_ORDER.map((role, i) => [role, i]))

export function newLayer(
  typeId: string,
  role: LayerRole,
  id: IdFactory,
): StackLayer {
  return { id: id(), typeId, role }
}

export function sortStack(stack: StackLayer[]): StackLayer[] {
  return [...stack].sort(
    (a, b) => (ROLE_INDEX.get(a.role) ?? 99) - (ROLE_INDEX.get(b.role) ?? 99),
  )
}

export function countRole(stack: StackLayer[], role: LayerRole): number {
  return stack.filter((layer) => layer.role === role).length
}

export function hasRole(stack: StackLayer[], role: LayerRole): boolean {
  return stack.some((layer) => layer.role === role)
}

export function findRole(
  stack: StackLayer[],
  role: LayerRole,
): StackLayer | undefined {
  return stack.find((layer) => layer.role === role)
}

export function setRoleCount(
  stack: StackLayer[],
  role: LayerRole,
  typeId: string,
  count: number,
  id: IdFactory,
): StackLayer[] {
  const kept = stack.filter((layer) => layer.role !== role)
  const existing = stack.filter((layer) => layer.role === role)
  const next = existing.slice(0, count).map((layer) => ({
    ...layer,
    typeId,
  }))
  while (next.length < count) {
    next.push(newLayer(typeId, role, id))
  }
  return sortStack([...kept, ...next])
}

export function toggleRole(
  stack: StackLayer[],
  role: LayerRole,
  typeId: string,
  on: boolean,
  id: IdFactory,
): StackLayer[] {
  return setRoleCount(stack, role, typeId, on ? 1 : 0, id)
}

export function readingFeeding(stack: StackLayer[]): FeedingConfig | null {
  const feederBox = findRole(stack, 'feeder-box')
  const feeder = findRole(stack, 'feeder')
  const extra = findRole(stack, 'feeding-body')
  if (!feederBox || !feeder || !extra) return null
  const feederBoxTypeId =
    feederBox.typeId === DEEP_BOX ? 'deep-box' : 'shallow-box'
  const extraBodyTypeId =
    extra.typeId === DEEP_BOX ? 'deep-box' : 'shallow-box'
  const feederTypeId =
    feeder.typeId === 'feeding-jar' ? 'feeding-jar' : 'round-feeder'
  return { feederBoxTypeId, feederTypeId, extraBodyTypeId }
}

export function setFeeding(
  stack: StackLayer[],
  feeding: FeedingConfig | null,
  id: IdFactory,
): StackLayer[] {
  const without = stack.filter(
    (layer) =>
      layer.role !== 'feeder-box' &&
      layer.role !== 'feeder' &&
      layer.role !== 'feeding-body',
  )
  if (!feeding) return sortStack(without)
  return sortStack([
    ...without,
    newLayer(feeding.feederBoxTypeId, 'feeder-box', id),
    newLayer(feeding.feederTypeId, 'feeder', id),
    newLayer(feeding.extraBodyTypeId, 'feeding-body', id),
  ])
}

export function addExtra(
  stack: StackLayer[],
  typeId: string,
  id: IdFactory,
): StackLayer[] {
  return sortStack([...stack, newLayer(typeId, 'extra', id)])
}

export function removeLayer(stack: StackLayer[], layerId: string): StackLayer[] {
  return stack.filter((layer) => layer.id !== layerId)
}
