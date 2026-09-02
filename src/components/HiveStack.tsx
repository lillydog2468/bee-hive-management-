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

const REQUIRED_ROLES = new Set(['bottom', 'inner-cover', 'lid'])

export function HiveStack({
  stack,
  types,
  missingLid = false,
  missingBottom = false,
  missingInner = false,
}: {
  stack: StackLayer[]
  types: EquipmentType[]
  missingLid?: boolean
  missingBottom?: boolean
  missingInner?: boolean
}) {
  const names = new Map(types.map((type) => [type.id, type.shortName]))
  const movable = stack.filter((layer) => !layer.siteLocked)
  const missingRequired = missingLid || missingBottom || missingInner
  if (stack.length === 0 && !missingRequired) {
    return (
      <div className="stack is-empty">
        <p>No kit assigned. Unused counts stay as they are until you set a stack.</p>
      </div>
    )
  }

  const visual = stack.filter((layer) => layer.role !== 'feeder')
  const feeder = stack.find((layer) => layer.role === 'feeder')
  const onlyRequired =
    movable.length > 0 &&
    movable.every((layer) => REQUIRED_ROLES.has(layer.role))
  const padLocked = stack.some((layer) => layer.siteLocked)
  const onlyPadKit = movable.length === 0 && padLocked && !missingRequired

  return (
    <div className="stack" aria-label="Hive stack, bottom to top">
      {missingLid ? (
        <div className="layer role-lid is-missing">
          <span className="layer-name">Lid</span>
          <span className="layer-type">Required — choose metal or wooden</span>
        </div>
      ) : null}
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
            {layer.siteLocked ? (
              <span className="feeder-chip">Stays on this pad</span>
            ) : null}
            {feeding && feeder ? (
              <span className="feeder-chip">
                {names.get(feeder.typeId) ?? feeder.typeId}
              </span>
            ) : null}
          </div>
        )
      })}
      {missingRequired ? (
        <p className="stack-caption">
          Every hive needs a bottom board, an inner cover and a lid. Spare
          bottoms and covers are in Unused until you put them on. You can
          assign them without counting every board first. Garage wooden lids
          stay on those pads.
        </p>
      ) : padLocked && onlyRequired ? (
        <p className="stack-caption">
          This pad’s bottom board and wooden lid stay here. The inner cover stays
          on the hive. Unused-pool boxes are not assigned yet.
        </p>
      ) : onlyPadKit ? (
        <p className="stack-caption">
          This pad’s bottom board and wooden lid stay here. Unused-pool boxes are not assigned yet.
        </p>
      ) : onlyRequired ? (
        <p className="stack-caption">
          Bottom board, inner cover and lid stay on the hive. Brood chambers and
          supers are not set yet.
        </p>
      ) : (
        <p className="stack-caption">Top of hive ↑ · Bottom of hive ↓</p>
      )}
    </div>
  )
}
