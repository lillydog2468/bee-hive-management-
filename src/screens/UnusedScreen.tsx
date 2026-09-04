import {
  ADD_TO_LABELS,
  BOTTOM_BOARD,
  DEEP_BOX,
  DEEP_USED_FRAME,
  GROUP_LABELS,
  GROUP_ORDER,
  INNER_COVER,
  METAL_LID,
  SHALLOW_BOX,
  SHALLOW_FRAME,
  UNBUILT_SPRING_FRAME,
  WAXED_SPRING_FRAME,
  QUEEN_EXCLUDER,
  WOODEN_LID,
} from '../domain/equipment.ts'
import { framesTotalForTag } from '../domain/inventory.ts'
import { Layout } from '../components/Layout.tsx'
import { SortableKitList } from '../components/SortableKitList.tsx'
import { useStore } from '../state/context.ts'

export function UnusedScreen() {
  const { state, go } = useStore()
  const lockedPads = state.pads.filter((pad) => pad.lockedBottomAndLid)
  const lockedFull = lockedPads.filter((pad) => pad.size === 'full-size').length
  const lockedNuc = lockedPads.filter((pad) => pad.size === 'nuc').length
  const deepTotal = framesTotalForTag(state, 'deep')
  const shallowTotal = framesTotalForTag(state, 'shallow')
  const showDeepTotal = state.equipmentTypes.some(
    (type) => type.frameTotal === 'deep',
  )
  const showShallowTotal = state.equipmentTypes.some(
    (type) => type.frameTotal === 'shallow',
  )

  return (
    <Layout
      title="Unused kit"
      subtitle="Your list only, in four sections. Add a type to any section, type an owned count, and delete anything you do not use. Unused is owned minus what is on a hive."
    >
      {showDeepTotal || showShallowTotal ? (
        <section className="group">
          <p className="spotlight-kicker">Frame totals</p>
          <h2>Tagged lots</h2>
          <p className="card-copy">
            Sum of types you tagged when adding them. Untagged lots are not
            included, so mixed spring frames stay out of these totals until you
            say otherwise.
          </p>
          <ul className="totals-list">
            {showDeepTotal ? (
              <li>
                <span>All deep frames</span>
                <span>
                  {Math.max(0, deepTotal.unused)} unused · {deepTotal.owned}{' '}
                  owned
                </span>
              </li>
            ) : null}
            {showShallowTotal ? (
              <li>
                <span>All shallow frames</span>
                <span>
                  {Math.max(0, shallowTotal.unused)} unused ·{' '}
                  {shallowTotal.owned} owned
                </span>
              </li>
            ) : null}
          </ul>
        </section>
      ) : null}

      {lockedPads.length > 0 ? (
        <div className="banner">
          <p>
            Above the garage, each of the {lockedFull} full-size pad
            {lockedFull === 1 ? '' : 's'} and {lockedNuc} nuc pad
            {lockedNuc === 1 ? '' : 's'} has its own bottom board and wooden lid.
            Those stay on that site. They are not unused kit, and they cannot go
            on the L-yard or the far-side hive.
          </p>
        </div>
      ) : null}

      {GROUP_ORDER.map((group) => {
        const types = state.equipmentTypes.filter((type) => type.group === group)
        return (
          <section key={group} className="group">
            <div className="group-head">
              <h2>{GROUP_LABELS[group]}</h2>
              <button
                type="button"
                className="chip"
                onClick={() => go({ page: 'stock', typeId: 'new', group })}
              >
                {ADD_TO_LABELS[group]}
              </button>
            </div>
            {types.length === 0 ? (
              <p className="card-copy">None in this section yet.</p>
            ) : (
              <SortableKitList
                group={group}
                types={types}
                noteFor={starterNote}
                onOpen={(typeId) => go({ page: 'stock', typeId })}
              />
            )}
          </section>
        )
      })}

      <p className="footnote">
        Add to a section with the button on that heading. Drag the handle on the
        left to reorder types within that section. Tap a type to edit its name,
        owned count, photo, or delete it. Assigning kit to a hive takes it out
        of unused; taking it off a hive returns it.
      </p>
    </Layout>
  )
}

function starterNote(typeId: string): string | undefined {
  if (typeId === DEEP_BOX) {
    return '20 owned at start; 12 on L-yard brood, so 8 unused'
  }
  if (typeId === SHALLOW_BOX) return '20 unused at start'
  if (typeId === METAL_LID) {
    return '12 owned at start; 7 on L-yard full-size hives, 5 spare'
  }
  if (typeId === BOTTOM_BOARD) {
    return '2 spare at start; not auto-assigned. Garage pad bottoms stay on those pads'
  }
  if (typeId === INNER_COVER) {
    return '2 spare at start; not auto-assigned onto the L-yard hives'
  }
  if (typeId === DEEP_USED_FRAME) return '50 deep used at start; not mixed with spring lots'
  if (typeId === WAXED_SPRING_FRAME) {
    return '50 mixed deep and shallow at start; no subtype counts invented'
  }
  if (typeId === UNBUILT_SPRING_FRAME) {
    return '50 mix at start; no deep/shallow split invented'
  }
  if (typeId === SHALLOW_FRAME) {
    return 'not a split of the spring lots; type a number if you count shallows separately'
  }
  if (typeId === WOODEN_LID) {
    return 'garage pad lids stay on those pads; extra unused wooden lids not counted'
  }
  if (typeId === QUEEN_EXCLUDER) {
    return 'not counted at start; type a number when you have one, then put it on a hive from Parts'
  }
  return undefined
}
