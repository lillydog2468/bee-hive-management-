import { boxDepth } from '../domain/equipment.ts'
import type { EquipmentType, StackLayer } from '../domain/types.ts'

const ROLE_LABEL: Record<string, string> = {
  bottom: 'Bottom board',
  brood: 'Brood chamber',
  'nuc-box': 'Nuc box',
  super: 'Honey super',
  'inner-cover': 'Inner cover',
  'feeder-box': 'Empty box (feeding)',
  feeder: 'Feeder',
  'feeding-body': 'Extra body (anti-robbing)',
  lid: 'Lid',
  extra: 'Other kit',
}

export function HiveStack({
  stack,
  types,
}: {
  stack: StackLayer[]
  types: EquipmentType[]
}) {
  const names = new Map(types.map((type) => [type.id, type.shortName]))
  if (stack.length === 0) {
    return (
      <div className="stack is-empty">
        <p>No kit assigned. Unused counts stay as they are until you set a stack.</p>
      </div>
    )
  }

  const visual = stack.filter((layer) => layer.role !== 'feeder')
  const feeder = stack.find((layer) => layer.role === 'feeder')

  return (
    <div className="stack" aria-label="Hive stack, bottom to top">
      {[...visual].reverse().map((layer) => {
        const depth = boxDepth(layer.typeId)
        const feeding = layer.role === 'feeder-box'
        return (
          <div
            key={layer.id}
            className={`layer depth-${depth} role-${layer.role} type-${layer.typeId}`}
          >
            <span className="layer-name">
              {ROLE_LABEL[layer.role] ?? 'Kit'}
            </span>
            <span className="layer-type">{names.get(layer.typeId) ?? layer.typeId}</span>
            {feeding && feeder ? (
              <span className="feeder-chip">
                {names.get(feeder.typeId) ?? feeder.typeId}
              </span>
            ) : null}
          </div>
        )
      })}
      <p className="stack-caption">Top of hive ↑ · Bottom of hive ↓</p>
    </div>
  )
}
