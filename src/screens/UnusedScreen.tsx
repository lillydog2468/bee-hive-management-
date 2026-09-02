import {
  BOTTOM_BOARD,
  FRAME_CONDITION_IDS,
  GROUP_LABELS,
  GROUP_ORDER,
  INNER_COVER,
  METAL_LID,
  SHALLOW_FRAME,
  WOODEN_LID,
} from '../domain/equipment.ts'
import { inUseCount, unusedCount } from '../domain/inventory.ts'
import type { EquipmentType } from '../domain/types.ts'
import { Layout } from '../components/Layout.tsx'
import { useStore } from '../state/context.ts'

export function UnusedScreen() {
  const { state, inUse, go } = useStore()
  const shortfalls = state.equipmentTypes.filter((type) => {
    const owned = state.owned[type.id] ?? 0
    return inUseCount(inUse, type.id) > owned
  })
  const lockedPads = state.pads.filter((pad) => pad.lockedBottomAndLid)
  const lockedFull = lockedPads.filter((pad) => pad.size === 'full-size').length
  const lockedNuc = lockedPads.filter((pad) => pad.size === 'nuc').length
  const metal = state.equipmentTypes.find((type) => type.id === METAL_LID)
  const frameLots = FRAME_CONDITION_IDS.map((id) =>
    state.equipmentTypes.find((type) => type.id === id),
  ).filter((type): type is EquipmentType => Boolean(type))
  const featured = new Set<string>([METAL_LID, ...FRAME_CONDITION_IDS])

  return (
    <Layout
      title="Unused kit"
      subtitle="Owned equipment that is not assigned to a hive stack. This is the number to trust when you want to know what is free."
    >
      {metal ? (
        <section className="group">
          <p className="spotlight-kicker">Spare lids</p>
          <h2>Metal lids</h2>
          <p className="card-copy">
            Seven are on the L-yard full-size hives. Five are spare. The outdoor
            4-frame nucs and the far-side 5-frame nuc still need a lid chosen —
            no extra metal lids were assumed for them.
          </p>
          <ul className="kit-list">
            <KitRow
              type={metal}
              owned={state.owned[metal.id] ?? 0}
              used={inUseCount(inUse, metal.id)}
              spotlight
              onOpen={() => go({ page: 'stock', typeId: metal.id })}
            />
          </ul>
        </section>
      ) : null}

      {frameLots.length > 0 ? (
        <section className="group">
          <p className="spotlight-kicker">Frames by condition</p>
          <h2>Three lots</h2>
          <p className="card-copy">
            Counted by condition, not as one pile. 50 deep used. 50 waxed, ready
            for spring. 50 unbuilt, ready for spring. The last two were not named
            as deep or shallow.
          </p>
          <ul className="kit-list">
            {frameLots.map((type) => (
              <KitRow
                key={type.id}
                type={type}
                owned={state.owned[type.id] ?? 0}
                used={inUseCount(inUse, type.id)}
                spotlight
                onOpen={() => go({ page: 'stock', typeId: type.id })}
              />
            ))}
          </ul>
        </section>
      ) : null}

      {lockedPads.length > 0 ? (
        <div className="banner">
          <p>
            Above the garage, each of the {lockedFull} full-size pad
            {lockedFull === 1 ? '' : 's'} and {lockedNuc} nuc pad
            {lockedNuc === 1 ? '' : 's'} has its own bottom board and wooden lid.
            Those stay on that site. They are not unused kit, and they cannot go on
            the L-yard or the far-side hive.
          </p>
        </div>
      ) : null}
      {shortfalls.length > 0 ? (
        <div className="banner warn">
          <p>
            {shortfalls.length === 1
              ? 'One type is on hives but not yet in stock. Add what you actually own.'
              : `${shortfalls.length} types are on hives but not yet in stock. Add what you actually own.`}
          </p>
        </div>
      ) : null}

      {GROUP_ORDER.map((group) => {
        const types = state.equipmentTypes.filter(
          (type) => type.group === group && !featured.has(type.id),
        )
        if (types.length === 0) return null
        return (
          <section key={group} className="group">
            <h2>{GROUP_LABELS[group]}</h2>
            <ul className="kit-list">
              {types.map((type) => (
                <KitRow
                  key={type.id}
                  type={type}
                  owned={state.owned[type.id] ?? 0}
                  used={inUseCount(inUse, type.id)}
                  note={
                    type.id === BOTTOM_BOARD
                      ? 'on every hive; spare count not given. garage pad bottoms stay on those pads'
                      : type.id === INNER_COVER
                        ? 'on every hive; spare count not given'
                        : type.id === WOODEN_LID
                          ? 'garage pad lids stay on those pads and cannot be used elsewhere'
                          : type.id === SHALLOW_FRAME
                            ? 'no shallow count given'
                            : undefined
                  }
                  onOpen={() => go({ page: 'stock', typeId: type.id })}
                />
              ))}
            </ul>
          </section>
        )
      })}

      <p className="footnote">
        Tap a type to add or adjust stock. Assigning kit to a hive takes it out of
        unused; taking it off a hive returns it.
      </p>
      <a className="secondary link-btn" href="#/kit/new">
        Add a type
      </a>
    </Layout>
  )
}

function KitRow({
  type,
  owned,
  used,
  onOpen,
  spotlight = false,
  note,
}: {
  type: EquipmentType
  owned: number
  used: number
  onOpen: () => void
  spotlight?: boolean
  note?: string
}) {
  const unused = unusedCount(owned, used)
  const free = Math.max(0, unused)
  const extras = [
    used > owned ? `short by ${used - owned}` : '',
    note ?? '',
  ].filter(Boolean)
  return (
    <li>
      <button
        type="button"
        className={spotlight ? 'kit-row is-spotlight' : 'kit-row'}
        onClick={onOpen}
      >
        <span className="kit-copy">
          <span className="kit-name">{type.name}</span>
          <span className="kit-meta">
            {owned} owned · {used} on hives
            {extras.length > 0 ? ` · ${extras.join(' · ')}` : ''}
          </span>
        </span>
        <span
          className={
            unused < 0
              ? 'kit-count is-short'
              : free > 0
                ? 'kit-count is-free'
                : 'kit-count'
          }
        >
          {free}
        </span>
      </button>
    </li>
  )
}
