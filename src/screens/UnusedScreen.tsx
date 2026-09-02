import {
  BOTTOM_BOARD,
  DEEP_BOX,
  DEEP_USED_FRAME,
  GROUP_LABELS,
  GROUP_ORDER,
  INNER_COVER,
  METAL_LID,
  SHALLOW_BOX,
  SHALLOW_FRAME,
  SPRING_FRAME_LOT_IDS,
  UNBUILT_SPRING_FRAME,
  WAXED_SPRING_FRAME,
  WOODEN_LID,
} from '../domain/equipment.ts'
import {
  inUseCount,
  isUncountedOnHives,
  unusedCount,
} from '../domain/inventory.ts'
import type { EquipmentType } from '../domain/types.ts'
import { KitThumb } from '../components/KitIllustration.tsx'
import { Layout } from '../components/Layout.tsx'
import { useStore } from '../state/context.ts'

export function UnusedScreen() {
  const { state, inUse, go } = useStore()
  const lockedPads = state.pads.filter((pad) => pad.lockedBottomAndLid)
  const lockedFull = lockedPads.filter((pad) => pad.size === 'full-size').length
  const lockedNuc = lockedPads.filter((pad) => pad.size === 'nuc').length
  const metal = state.equipmentTypes.find((type) => type.id === METAL_LID)
  const usedFrames = state.equipmentTypes.find((type) => type.id === DEEP_USED_FRAME)
  const springLots = SPRING_FRAME_LOT_IDS.map((id) =>
    state.equipmentTypes.find((type) => type.id === id),
  ).filter((type): type is EquipmentType => Boolean(type))
  const boxes = [DEEP_BOX, SHALLOW_BOX]
    .map((id) => state.equipmentTypes.find((type) => type.id === id))
    .filter((type): type is EquipmentType => Boolean(type))
  const featured = new Set<string>([
    METAL_LID,
    BOTTOM_BOARD,
    INNER_COVER,
    DEEP_USED_FRAME,
    DEEP_BOX,
    SHALLOW_BOX,
    ...SPRING_FRAME_LOT_IDS,
  ])
  const rest = state.equipmentTypes.filter((type) => !featured.has(type.id))
  const onHivesUncounted = rest.filter((type) =>
    isUncountedOnHives(state.owned[type.id] ?? 0, inUseCount(inUse, type.id)),
  )
  const countedShort = rest.filter((type) => {
    const owned = state.owned[type.id] ?? 0
    const used = inUseCount(inUse, type.id)
    return owned > 0 && used > owned
  })
  const notCounted = rest.filter((type) => {
    const owned = state.owned[type.id] ?? 0
    const used = inUseCount(inUse, type.id)
    return owned === 0 && used === 0
  })
  const leftoverFree = rest.filter((type) => {
    const owned = state.owned[type.id] ?? 0
    const used = inUseCount(inUse, type.id)
    return unusedCount(owned, used) > 0
  })

  return (
    <Layout
      title="Unused kit"
      subtitle="What is free: owned minus what is on a hive. Numbers you have not counted yet start at 0 — tap a type and type them in when you are ready."
    >
      {boxes.length > 0 ? (
        <section className="group">
          <p className="spotlight-kicker">Boxes</p>
          <h2>Deep and shallow</h2>
          <p className="card-copy">
            20 deep boxes owned; 12 are on L-yard brood, so 8 are unused. 20
            unused shallow boxes. Change a number when you count.
          </p>
          <ul className="kit-list">
            {boxes.map((type) => (
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

      <section className="group">
        <p className="spotlight-kicker">Spare boards</p>
        <h2>Bottoms and inner covers</h2>
        <p className="card-copy">
          2 spare bottom boards and 2 spare inner covers. They are not
          auto-assigned onto the L-yard hives. Every hive still needs both;
          assigning one takes it out of unused. Garage pad bottoms stay on those
          pads.
        </p>
        <ul className="kit-list">
          {[BOTTOM_BOARD, INNER_COVER].map((id) => {
            const type = state.equipmentTypes.find((item) => item.id === id)
            if (!type) return null
            return (
              <KitRow
                key={type.id}
                type={type}
                owned={state.owned[type.id] ?? 0}
                used={inUseCount(inUse, type.id)}
                spotlight
                onOpen={() => go({ page: 'stock', typeId: type.id })}
              />
            )
          })}
        </ul>
      </section>

      {usedFrames ? (
        <section className="group">
          <p className="spotlight-kicker">Used frames</p>
          <h2>Deep used</h2>
          <p className="card-copy">These 50 are deep. The waxed lot below is mixed, not more deeps.</p>
          <ul className="kit-list">
            <KitRow
              type={usedFrames}
              owned={state.owned[usedFrames.id] ?? 0}
              used={inUseCount(inUse, usedFrames.id)}
              spotlight
              onOpen={() => go({ page: 'stock', typeId: usedFrames.id })}
            />
          </ul>
        </section>
      ) : null}

      {springLots.length > 0 ? (
        <section className="group">
          <p className="spotlight-kicker">Ready for spring</p>
          <h2>Two lots</h2>
          <p className="card-copy">
            50 new waxed frames, ready for spring — some deep and some shallow,
            shown as one lot of 50, with no invented deep/shallow counts. 50
            unbuilt, ready for spring — still a mix; more detail has not been
            given, so no split is invented for those either.
          </p>
          <ul className="kit-list">
            {springLots.map((type) => (
              <KitRow
                key={type.id}
                type={type}
                owned={state.owned[type.id] ?? 0}
                used={inUseCount(inUse, type.id)}
                spotlight
                note={
                  type.id === WAXED_SPRING_FRAME
                    ? 'mixed deep and shallow; total 50, no subtype counts'
                    : type.id === UNBUILT_SPRING_FRAME
                      ? 'mix pending more detail; no split invented'
                      : undefined
                }
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

      {onHivesUncounted.length > 0 ? (
        <section className="group">
          <p className="spotlight-kicker">On hives</p>
          <h2>Owned not counted yet</h2>
          <p className="card-copy">
            These are already on hives. Owned stock starts at 0 because it has
            not been counted. That is not a problem — tap a row and type a
            number when you have one.
          </p>
          <ul className="kit-list">
            {onHivesUncounted.map((type) => (
              <KitRow
                key={type.id}
                type={type}
                owned={state.owned[type.id] ?? 0}
                used={inUseCount(inUse, type.id)}
                onOpen={() => go({ page: 'stock', typeId: type.id })}
              />
            ))}
          </ul>
        </section>
      ) : null}

      {countedShort.length > 0 ? (
        <section className="group">
          <p className="spotlight-kicker">Mismatch</p>
          <h2>On hives vs owned</h2>
          <p className="card-copy">
            More of these sit on hives than the owned number. Type a different
            owned count if that number is wrong — the app will not invent one.
          </p>
          <ul className="kit-list">
            {countedShort.map((type) => (
              <KitRow
                key={type.id}
                type={type}
                owned={state.owned[type.id] ?? 0}
                used={inUseCount(inUse, type.id)}
                onOpen={() => go({ page: 'stock', typeId: type.id })}
              />
            ))}
          </ul>
        </section>
      ) : null}

      {notCounted.length > 0 ? (
        <section className="group">
          <p className="spotlight-kicker">Not counted yet</p>
          <h2>Type a number later</h2>
          <p className="card-copy">
            These start at 0. Tap a type when you count it. Exact totals are not
            needed to use the rest of the app.
          </p>
          <ul className="kit-list">
            {notCounted.map((type) => (
              <KitRow
                key={type.id}
                type={type}
                owned={state.owned[type.id] ?? 0}
                used={inUseCount(inUse, type.id)}
                note={
                  type.id === SHALLOW_FRAME
                    ? 'not a split of the spring lots; type a number if you count shallows separately'
                    : type.id === WOODEN_LID
                      ? 'garage pad lids stay on those pads; extra unused wooden lids not counted'
                      : undefined
                }
                onOpen={() => go({ page: 'stock', typeId: type.id })}
              />
            ))}
          </ul>
        </section>
      ) : null}

      {GROUP_ORDER.map((group) => {
        const types = leftoverFree.filter((type) => type.group === group)
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
                  onOpen={() => go({ page: 'stock', typeId: type.id })}
                />
              ))}
            </ul>
          </section>
        )
      })}

      <p className="footnote">
        Tap a type to type or step the owned count. Assigning kit to a hive
        takes it out of unused; taking it off a hive returns it.
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
  const { photos } = useStore()
  const unused = unusedCount(owned, used)
  const free = Math.max(0, unused)
  const uncounted = isUncountedOnHives(owned, used)
  const short = owned > 0 && used > owned
  const extras = [
    uncounted ? 'owned not counted yet' : '',
    short ? `short by ${used - owned}` : '',
    note ?? '',
  ].filter(Boolean)
  return (
    <li>
      <button
        type="button"
        className={spotlight ? 'kit-row is-spotlight' : 'kit-row'}
        onClick={onOpen}
      >
        <KitThumb typeId={type.id} photo={photos.types[type.id]} />
        <span className="kit-copy">
          <span className="kit-name">{type.name}</span>
          <span className="kit-meta">
            {owned} owned · {used} on hives
            {extras.length > 0 ? ` · ${extras.join(' · ')}` : ''}
          </span>
        </span>
        <span
          className={
            short
              ? 'kit-count is-short'
              : uncounted
                ? 'kit-count is-uncounted'
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
