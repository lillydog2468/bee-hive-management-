import { useState } from 'react'
import { HiveStack } from '../components/HiveStack.tsx'
import { Layout } from '../components/Layout.tsx'
import { PhotoField } from '../components/PhotoField.tsx'
import { Sheet } from '../components/Sheet.tsx'
import { Stepper } from '../components/Stepper.tsx'
import { formatLitres, formatUkDate, todayInPrague } from '../domain/dates.ts'
import {
  BOTTOM_BOARD,
  defaultUnitForGroup,
  GROUP_LABELS,
  GROUP_ORDER,
  INNER_COVER,
  isLidChoice,
  isMainBoxType,
} from '../domain/equipment.ts'
import { unusedCount } from '../domain/inventory.ts'
import { hiveKindLabel, padSizeLabel } from '../domain/names.ts'
import {
  canRemoveLayer,
  hiveNeedsBottom,
  hiveNeedsInnerCover,
  hiveNeedsLidChoice,
  hiveShouldHaveMetalLid,
} from '../domain/requiredParts.ts'
import { displayStack, hasLockedBottomAndLid, hivePad } from '../domain/siteLocked.ts'
import { countRole, readingFeeding } from '../domain/stack.ts'
import type { EquipmentGroup, EquipmentType, FeedingConfig, StackLayer } from '../domain/types.ts'
import { useStore } from '../state/context.ts'

const PART_ROLES = new Set(['bottom', 'inner-cover', 'lid', 'extra'])

export function HiveScreen({ hiveId }: { hiveId: string }) {
  const { state, dispatch, go, photos, setHivePhoto } = useStore()
  const hive = state.hives.find((item) => item.id === hiveId)
  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState(hive?.name ?? '')
  const [moveOpen, setMoveOpen] = useState(false)
  const [partOpen, setPartOpen] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [feedOpen, setFeedOpen] = useState(false)
  const [feedDate, setFeedDate] = useState(todayInPrague)
  const [feedLitres, setFeedLitres] = useState('')
  const [splitOpen, setSplitOpen] = useState(false)
  const [splitDate, setSplitDate] = useState(todayInPrague)
  const [splitPadId, setSplitPadId] = useState<string | null>(null)

  if (!hive) {
    return (
      <Layout title="Unknown hive" back={{ label: 'Hives', href: '#/hives' }}>
        <p className="lede">That hive is not in this list.</p>
      </Layout>
    )
  }

  const site = state.sites.find((item) => item.id === hive.siteId)
  const pad = hivePad(state, hive)
  const lockedPad = hasLockedBottomAndLid(pad)
  const shown = displayStack(hive, pad)
  const brood = countRole(hive.stack, 'brood')
  const supers = countRole(hive.stack, 'super')
  const nucBoxes = countRole(hive.stack, 'nuc-box')
  const feeding = readingFeeding(hive.stack)
  const parts = shown.filter((layer) => PART_ROLES.has(layer.role))
  const needsLid = hiveNeedsLidChoice(hive, pad)
  const needsBottom = hiveNeedsBottom(hive, pad)
  const needsInner = hiveNeedsInnerCover(hive)
  const lidTypes = state.equipmentTypes.filter(isLidChoice)
  const metalLidLocked = hiveShouldHaveMetalLid(hive, pad)
  const hasReturnableKit = hive.stack.some(
    (layer) =>
      layer.role !== 'bottom' &&
      layer.role !== 'inner-cover' &&
      layer.role !== 'lid',
  )

  function setFeeding(next: FeedingConfig | null) {
    dispatch({ type: 'set-feeding', hiveId: hive!.id, feeding: next })
  }

  function defaultFeeding(): FeedingConfig {
    return {
      feederBoxTypeId: 'shallow-box',
      feederTypeId: 'round-feeder',
      extraBodyTypeId: 'shallow-box',
    }
  }

  return (
    <Layout
      title={hive.name}
      subtitle={`${hiveKindLabel(hive.kind)} · ${site?.name ?? 'Unknown site'}`}
      back={{ label: 'Hives', href: '#/hives' }}
      actions={
        <button
          className="text-btn"
          type="button"
          onClick={() => {
            setName(hive.name)
            setRenaming(true)
          }}
        >
          Rename
        </button>
      }
    >
      {photos.hives[hive.id] ? (
        <img className="hive-photo" src={photos.hives[hive.id]} alt="" />
      ) : null}
      <PhotoField
        photo={photos.hives[hive.id]}
        onChange={(dataUrl) => setHivePhoto(hive.id, dataUrl)}
        onRemove={() => setHivePhoto(hive.id, null)}
        addLabel="Add a photo of this hive"
      />

      <HiveStack
        stack={shown}
        types={state.equipmentTypes}
        missingLid={needsLid}
        missingBottom={needsBottom}
        missingInner={needsInner}
      />

      <FeedingLog
        feedings={hive.feedings}
        onAdd={() => {
          setFeedDate(todayInPrague())
          setFeedLitres('')
          setFeedOpen(true)
        }}
        onRemove={(feedingId) =>
          dispatch({ type: 'remove-feeding', hiveId: hive.id, feedingId })
        }
      />

      {hive.kind === 'full-size' ? (
        <section className="card stack-card">
          <h2>Brood chambers</h2>
          <p className="card-copy">
            Deep 10-frame boxes. Add extra deeps if you do not have enough honey
            supers. Unused kit goes down when a deep goes on, and back up when it
            comes off.
          </p>
          <Stepper
            label="deep boxes"
            value={brood}
            min={0}
            max={12}
            onChange={(count) =>
              dispatch({ type: 'set-brood', hiveId: hive.id, count })
            }
          />

          <h2>Honey supers</h2>
          <p className="card-copy">Shallow 10-frame boxes, added in spring as needed.</p>
          <Stepper
            label="honey supers"
            value={supers}
            max={12}
            onChange={(count) =>
              dispatch({ type: 'set-supers', hiveId: hive.id, count })
            }
          />
        </section>
      ) : (
        <section className="card stack-card">
          <h2>Nuc boxes</h2>
          <p className="card-copy">
            {hive.kind === 'nuc-4'
              ? '4-frame nuc boxes on this hive.'
              : '5-frame nuc boxes on this hive. Two boxes is 10 frames in total.'}
          </p>
          <Stepper
            label="nuc boxes"
            value={nucBoxes}
            min={0}
            max={6}
            onChange={(count) =>
              dispatch({ type: 'set-nuc-boxes', hiveId: hive.id, count })
            }
          />
        </section>
      )}

      <section className="card">
        <div className="card-row">
          <div>
            <h2>Parts</h2>
            <p className="card-copy">
              Bottom board, inner cover, lid, and anything else on this hive
              that is not a box in the stack above — queen excluder, feeder,
              mouse guard, frames you want counted, or a type you add now.
              Taken from unused when it goes on; back to unused when you remove
              it.
            </p>
          </div>
          <button
            className="chip"
            type="button"
            onClick={() => setPartOpen(true)}
          >
            Add part
          </button>
        </div>
        {needsBottom ? (
          <div className="lid-needed">
            <p>
              <strong>Bottom board</strong> — every hive needs one. Put one on
              from Unused. Garage pad bottoms stay on those pads.
            </p>
            <div className="segment">
              <button
                type="button"
                onClick={() =>
                  dispatch({
                    type: 'toggle-part',
                    hiveId: hive.id,
                    part: 'bottom',
                    on: true,
                  })
                }
              >
                Put a bottom board on this hive
              </button>
            </div>
          </div>
        ) : null}
        {needsInner ? (
          <div className="lid-needed">
            <p>
              <strong>Inner cover</strong> — every hive needs one. Put one on
              from Unused.
            </p>
            <div className="segment">
              <button
                type="button"
                onClick={() =>
                  dispatch({
                    type: 'toggle-part',
                    hiveId: hive.id,
                    part: 'inner-cover',
                    on: true,
                  })
                }
              >
                Put an inner cover on this hive
              </button>
            </div>
          </div>
        ) : null}
        {needsLid ? (
          <div className="lid-needed">
            <p>
              <strong>Lid</strong> — every hive needs one. Choose from your lid
              types. Garage wooden lids stay on those pads and cannot be used
              here.
            </p>
            {lidTypes.length === 0 ? (
              <p className="card-copy">
                No lid types in your list. Add one with Add part if you need to
                put a lid on.
              </p>
            ) : (
              <div className="segment wrap-segment">
                {lidTypes.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      dispatch({
                        type: 'toggle-part',
                        hiveId: hive.id,
                        part: 'lid',
                        on: true,
                        lidTypeId: item.id,
                      })
                    }
                  >
                    {item.shortName || item.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : null}
        {parts.length === 0 && !needsBottom && !needsInner && !needsLid ? (
          <p className="card-copy">No parts on this hive yet.</p>
        ) : parts.length > 0 ? (
          <ul className="extra-list">
            {parts.map((layer) => (
              <PartRow
                key={layer.id}
                layer={layer}
                type={state.equipmentTypes.find((item) => item.id === layer.typeId)}
                lockedPad={lockedPad}
                metalLidLocked={metalLidLocked}
                canRemove={canRemoveLayer(hive, pad, layer)}
                onRemove={() =>
                  dispatch({
                    type: 'remove-layer',
                    hiveId: hive.id,
                    layerId: layer.id,
                  })
                }
              />
            ))}
          </ul>
        ) : null}
      </section>

      <section className="card stack-card">
        <div className="card-row">
          <div>
            <h2>Summer feeding</h2>
            <p className="card-copy">
              Empty box on the inner cover with a round feeder or jar, then an extra body and lid so robbers and wasps cannot get in.
            </p>
          </div>
          <button
            type="button"
            className={feeding ? 'chip is-on' : 'chip'}
            onClick={() => setFeeding(feeding ? null : defaultFeeding())}
          >
            {feeding ? 'On' : 'Off'}
          </button>
        </div>
        {feeding ? (
          <>
            <h3 className="sheet-sub">Empty feeder box</h3>
            <div className="segment">
              <Choice
                on={feeding.feederBoxTypeId === 'shallow-box'}
                onClick={() =>
                  setFeeding({ ...feeding, feederBoxTypeId: 'shallow-box' })
                }
              >
                Shallow
              </Choice>
              <Choice
                on={feeding.feederBoxTypeId === 'deep-box'}
                onClick={() =>
                  setFeeding({ ...feeding, feederBoxTypeId: 'deep-box' })
                }
              >
                Deep
              </Choice>
            </div>
            <h3 className="sheet-sub">Feeder</h3>
            <div className="segment">
              <Choice
                on={feeding.feederTypeId === 'round-feeder'}
                onClick={() =>
                  setFeeding({ ...feeding, feederTypeId: 'round-feeder' })
                }
              >
                Round feeder
              </Choice>
              <Choice
                on={feeding.feederTypeId === 'feeding-jar'}
                onClick={() =>
                  setFeeding({ ...feeding, feederTypeId: 'feeding-jar' })
                }
              >
                Feeding jar
              </Choice>
            </div>
            <h3 className="sheet-sub">Extra body</h3>
            <div className="segment">
              <Choice
                on={feeding.extraBodyTypeId === 'shallow-box'}
                onClick={() =>
                  setFeeding({ ...feeding, extraBodyTypeId: 'shallow-box' })
                }
              >
                Shallow
              </Choice>
              <Choice
                on={feeding.extraBodyTypeId === 'deep-box'}
                onClick={() =>
                  setFeeding({ ...feeding, extraBodyTypeId: 'deep-box' })
                }
              >
                Deep
              </Choice>
            </div>
          </>
        ) : null}
      </section>

      <section className="card">
        <div className="card-row">
          <div>
            <h2>Inspections</h2>
            <p className="card-copy">
              Strength, brood you can see, the queen, and whether you added a
              box, frames, or made a split.
            </p>
          </div>
          <button
            type="button"
            className="chip"
            onClick={() => go({ page: 'inspect', hiveId: hive.id })}
          >
            Log inspection
          </button>
        </div>
        {hive.inspections.length === 0 ? (
          <p className="card-copy">No inspections logged yet.</p>
        ) : (
          <p className="card-copy">
            {hive.inspections.length} recorded. Newest on the inspections page.
          </p>
        )}
      </section>

      <section className="card">
        <div className="card-row">
          <div>
            <h2>Splits</h2>
            <p className="card-copy">
              Record a split from this hive onto an empty pad. Date, this hive,
              and the destination — nothing else until you add more later.
            </p>
          </div>
          <button
            type="button"
            className="chip"
            onClick={() => {
              setSplitDate(todayInPrague())
              setSplitPadId(null)
              setSplitOpen(true)
            }}
          >
            Record a split
          </button>
        </div>
        <SplitHistory
          hiveId={hive.id}
          splits={state.splits}
        />
      </section>

      <div className="actions">
        <button className="secondary" type="button" onClick={() => setMoveOpen(true)}>
          Move to another site
        </button>
        {hasReturnableKit ? (
          <button
            className="secondary"
            type="button"
            onClick={() => dispatch({ type: 'clear-stack', hiveId: hive.id })}
          >
            Return unused-pool kit
          </button>
        ) : null}
        <button className="danger-text" type="button" onClick={() => setConfirmRemove(true)}>
          Remove hive
        </button>
      </div>

      {feedOpen ? (
        <Sheet title="Add feeding" onClose={() => setFeedOpen(false)}>
          <p className="sheet-lede">
            Litres of sugar syrup on this hive. Mix ratio is not recorded.
          </p>
          <label className="field">
            <span>Date</span>
            <input
              type="date"
              value={feedDate}
              onChange={(event) => setFeedDate(event.target.value)}
            />
          </label>
          <label className="field">
            <span>Litres</span>
            <input
              type="number"
              min={0.1}
              step={0.5}
              inputMode="decimal"
              value={feedLitres}
              onChange={(event) => setFeedLitres(event.target.value)}
              placeholder="e.g. 2"
            />
          </label>
          <button
            className="primary"
            type="button"
            disabled={!(Number(feedLitres) > 0) || !feedDate}
            onClick={() => {
              dispatch({
                type: 'add-feeding',
                hiveId: hive.id,
                id: crypto.randomUUID(),
                date: feedDate,
                litres: Number(feedLitres),
              })
              setFeedOpen(false)
            }}
          >
            Save feeding
          </button>
        </Sheet>
      ) : null}

      {splitOpen ? (
        <SplitSheet
          hiveId={hive.id}
          date={splitDate}
          padId={splitPadId}
          onDate={setSplitDate}
          onPad={setSplitPadId}
          onClose={() => setSplitOpen(false)}
        />
      ) : null}

      {renaming ? (
        <Sheet title="Rename" onClose={() => setRenaming(false)}>
          <label className="field">
            <span>Name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="off"
            />
          </label>
          <button
            className="primary"
            type="button"
            onClick={() => {
              dispatch({ type: 'rename-hive', hiveId: hive.id, name })
              setRenaming(false)
            }}
          >
            Save name
          </button>
        </Sheet>
      ) : null}

      {moveOpen ? (
        <Sheet title="Move hive" onClose={() => setMoveOpen(false)}>
          <p className="sheet-lede">
            L-yard hives and kit can be moved — they are not glued to a pad.
            Unused-pool kit stays on the hive. A garage pad’s bottom board and
            wooden lid stay on that pad and cannot be used anywhere else.
          </p>
          <div className="choice-list">
            {state.sites.map((item) => {
              const emptyPads = state.pads.filter(
                (pad) => pad.siteId === item.id && !pad.occupiedHiveId,
              )
              return (
                <div key={item.id} className="move-site">
                  <button
                    type="button"
                    disabled={item.id === hive.siteId && !hive.padId}
                    onClick={() => {
                      dispatch({ type: 'move-hive', hiveId: hive.id, siteId: item.id })
                      setMoveOpen(false)
                    }}
                  >
                    {item.name}
                    {item.id === hive.siteId ? <span>Current site</span> : null}
                  </button>
                  {emptyPads.map((pad) => (
                    <button
                      key={pad.id}
                      type="button"
                      onClick={() => {
                        dispatch({
                          type: 'place-hive-on-pad',
                          hiveId: hive.id,
                          padId: pad.id,
                        })
                        setMoveOpen(false)
                      }}
                    >
                      {item.name} · {pad.name}
                    </button>
                  ))}
                </div>
              )
            })}
          </div>
        </Sheet>
      ) : null}

      {partOpen ? (
        <AddPartSheet hiveId={hive.id} onClose={() => setPartOpen(false)} />
      ) : null}

      {confirmRemove ? (
        <Sheet title="Remove hive?" onClose={() => setConfirmRemove(false)}>
          <p className="sheet-lede">
            Unused-pool kit on this stack returns to unused. A garage pad’s bottom board and wooden lid stay on the pad.
          </p>
          <button
            className="danger"
            type="button"
            onClick={() => {
              dispatch({ type: 'remove-hive', hiveId: hive.id })
              go({ page: 'hives' })
            }}
          >
            Remove hive
          </button>
        </Sheet>
      ) : null}
    </Layout>
  )
}

function FeedingLog({
  feedings,
  onAdd,
  onRemove,
}: {
  feedings: { id: string; date: string; litres: number }[]
  onAdd: () => void
  onRemove: (feedingId: string) => void
}) {
  const recent = [...feedings].sort((a, b) => {
    if (a.date === b.date) return b.id.localeCompare(a.id)
    return b.date.localeCompare(a.date)
  })
  return (
    <section className="card stack-card">
      <div className="card-row">
        <div>
          <h2>Sugar syrup</h2>
          <p className="card-copy">
            Litres fed, with the date. Empty until you add one.
          </p>
        </div>
        <button type="button" className="chip" onClick={onAdd}>
          Add feeding
        </button>
      </div>
      {recent.length === 0 ? (
        <p className="card-copy">No feedings logged yet.</p>
      ) : (
        <ul className="log-list">
          {recent.map((entry) => (
            <li key={entry.id}>
              <span>
                {formatUkDate(entry.date)} · {formatLitres(entry.litres)}
              </span>
              <button
                type="button"
                className="text-btn"
                onClick={() => onRemove(entry.id)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function SplitHistory({
  hiveId,
  splits,
}: {
  hiveId: string
  splits: {
    id: string
    date: string
    sourceHiveId: string
    sourceName: string
    destHiveId: string
    destName: string
    destSiteName: string
  }[]
}) {
  const related = splits
    .filter((item) => item.sourceHiveId === hiveId || item.destHiveId === hiveId)
    .sort((a, b) => b.date.localeCompare(a.date))
  if (related.length === 0) {
    return <p className="card-copy">No splits logged yet.</p>
  }
  return (
    <ul className="log-list">
      {related.map((item) => (
        <li key={item.id}>
          <span>
            {formatUkDate(item.date)} · from {item.sourceName} to {item.destName}{' '}
            ({item.destSiteName})
          </span>
        </li>
      ))}
    </ul>
  )
}

function SplitSheet({
  hiveId,
  date,
  padId,
  onDate,
  onPad,
  onClose,
}: {
  hiveId: string
  date: string
  padId: string | null
  onDate: (value: string) => void
  onPad: (value: string) => void
  onClose: () => void
}) {
  const { state, dispatch, go } = useStore()
  const emptyPads = state.pads.filter((pad) => !pad.occupiedHiveId)
  const selected = emptyPads.find((pad) => pad.id === padId)

  return (
    <Sheet title="Record a split" onClose={onClose}>
      <p className="sheet-lede">
        The split stays on this hive’s record and occupies the empty pad you
        pick. Add a pad on the aerial if you need more room.
      </p>
      <label className="field">
        <span>Date</span>
        <input
          type="date"
          value={date}
          onChange={(event) => onDate(event.target.value)}
        />
      </label>
      {emptyPads.length === 0 ? (
        <p className="sheet-lede">
          There is no empty pad yet. Add one on a site aerial, then come back.
        </p>
      ) : (
        <div className="choice-list">
          {state.sites.map((site) => {
            const pads = emptyPads.filter((pad) => pad.siteId === site.id)
            if (pads.length === 0) return null
            return pads.map((pad) => (
              <button
                key={pad.id}
                type="button"
                className={pad.id === padId ? 'is-on' : ''}
                onClick={() => onPad(pad.id)}
              >
                {site.name} · {pad.name}
                <span>Empty {padSizeLabel(pad.size).toLowerCase()}</span>
              </button>
            ))
          })}
        </div>
      )}
      <button
        className="primary"
        type="button"
        disabled={!selected || !date}
        onClick={() => {
          if (!selected) return
          const newHiveId = crypto.randomUUID()
          dispatch({
            type: 'record-split',
            id: crypto.randomUUID(),
            date,
            sourceHiveId: hiveId,
            destPadId: selected.id,
            newHiveId,
          })
          onClose()
          go({ page: 'hive', hiveId: newHiveId })
        }}
      >
        Occupy pad
      </button>
    </Sheet>
  )
}

function partRoleLabel(layer: StackLayer): string {
  if (layer.role === 'bottom') return 'Bottom board'
  if (layer.role === 'inner-cover') return 'Inner cover'
  if (layer.role === 'lid') return 'Lid'
  return 'Part'
}

function PartRow({
  layer,
  type,
  lockedPad,
  metalLidLocked,
  canRemove,
  onRemove,
}: {
  layer: StackLayer
  type: EquipmentType | undefined
  lockedPad: boolean
  metalLidLocked: boolean
  canRemove: boolean
  onRemove: () => void
}) {
  const name = type?.name ?? layer.typeId
  const title =
    layer.role === 'extra' ? name : `${partRoleLabel(layer)} · ${name}`
  const note = layer.siteLocked
    ? lockedPad
      ? 'Stays on this pad. Not unused kit, and it cannot be used on the L-yard or the far-side hive.'
      : 'Stays on this pad.'
    : layer.role === 'bottom'
      ? 'Taken from unused when you assigned it.'
      : layer.role === 'inner-cover'
        ? 'Taken from unused when you assigned it.'
        : layer.role === 'lid'
          ? metalLidLocked
            ? 'The large L-yard hives usually use metal lids.'
            : 'Taken from unused when you assigned it.'
          : undefined
  return (
    <li>
      <span>
        {title}
        {note ? <span className="lock-note">{note}</span> : null}
      </span>
      {canRemove ? (
        <button type="button" className="text-btn" onClick={onRemove}>
          Remove
        </button>
      ) : null}
    </li>
  )
}

function AddPartSheet({
  hiveId,
  onClose,
}: {
  hiveId: string
  onClose: () => void
}) {
  const { state, dispatch, inUse } = useStore()
  const hive = state.hives.find((item) => item.id === hiveId)
  const [addingType, setAddingType] = useState(false)
  const [newName, setNewName] = useState('')
  const [newGroup, setNewGroup] = useState<EquipmentGroup>('other')
  const [newOwned, setNewOwned] = useState(0)
  if (!hive) return null
  const pad = hivePad(state, hive)
  const locked = hasLockedBottomAndLid(pad)
  const hasBottom = hive.stack.some((layer) => layer.role === 'bottom')
  const hasInner = hive.stack.some((layer) => layer.role === 'inner-cover')
  const hasLid = hive.stack.some((layer) => layer.role === 'lid')

  function canPick(type: EquipmentType): boolean {
    if (isMainBoxType(type.id)) return false
    if (type.id === BOTTOM_BOARD) return !locked && !hasBottom
    if (type.id === INNER_COVER) return !hasInner
    if (isLidChoice(type)) return !locked && !hasLid
    return true
  }

  function putOn(typeId: string) {
    dispatch({
      type: 'add-part',
      hiveId,
      typeId,
      extraId: crypto.randomUUID(),
    })
    onClose()
  }

  const pickable = state.equipmentTypes.filter(canPick)

  return (
    <Sheet title="Add a part" onClose={onClose}>
      <p className="sheet-lede">
        Pick a type from unused, or add a new type into one of your four
        sections and put it on this hive. Owned 0 is fine until you have
        counted. Boxes stay on the stack above.
      </p>
      {GROUP_ORDER.map((group) => {
        const types = pickable.filter((type) => type.group === group)
        if (types.length === 0) return null
        return (
          <div key={group}>
            <h3 className="sheet-sub">{GROUP_LABELS[group]}</h3>
            <div className="choice-list">
              {types.map((type) => {
                const owned = state.owned[type.id] ?? 0
                const used = inUse[type.id] ?? 0
                const unused = unusedCount(owned, used)
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => putOn(type.id)}
                  >
                    {type.name}
                    <span>
                      {owned === 0 && used > 0
                        ? 'owned not counted yet'
                        : `${Math.max(0, unused)} unused`}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
      {addingType ? (
        <>
          <h3 className="sheet-sub">New type</h3>
          <label className="field">
            <span>Section</span>
            <select
              value={newGroup}
              onChange={(event) =>
                setNewGroup(event.target.value as EquipmentGroup)
              }
            >
              {GROUP_ORDER.map((group) => (
                <option key={group} value={group}>
                  {GROUP_LABELS[group]}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Name</span>
            <input
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="e.g. Mouse guard"
              autoComplete="off"
            />
          </label>
          <div className="card-row">
            <p className="card-copy">Owned count. Leave 0 until you count.</p>
            <Stepper
              label="owned count"
              value={newOwned}
              max={999}
              onChange={setNewOwned}
            />
          </div>
          <button
            className="primary"
            type="button"
            disabled={!newName.trim()}
            onClick={() => {
              const id = `custom-${crypto.randomUUID()}`
              dispatch({
                type: 'add-equipment-type',
                id,
                name: newName.trim(),
                group: newGroup,
                unit: defaultUnitForGroup(newGroup),
                owned: newOwned,
              })
              putOn(id)
            }}
          >
            Add and put on this hive
          </button>
        </>
      ) : (
        <button
          className="secondary"
          type="button"
          onClick={() => setAddingType(true)}
        >
          Add a new type
        </button>
      )}
    </Sheet>
  )
}

function Choice({
  on,
  onClick,
  children,
}: {
  on: boolean
  onClick: () => void
  children: string
}) {
  return (
    <button type="button" className={on ? 'is-on' : ''} onClick={onClick}>
      {children}
    </button>
  )
}
