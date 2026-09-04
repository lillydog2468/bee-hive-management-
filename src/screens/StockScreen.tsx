import { useState } from 'react'
import {
  ADD_TO_LABELS,
  BOTTOM_BOARD,
  DEEP_USED_FRAME,
  defaultUnitForGroup,
  GROUP_LABELS,
  GROUP_ORDER,
  INNER_COVER,
  METAL_LID,
  SHALLOW_FRAME,
  UNBUILT_SPRING_FRAME,
  WAXED_SPRING_FRAME,
  WOODEN_LID,
} from '../domain/equipment.ts'
import { KitThumb } from '../components/KitIllustration.tsx'
import { Layout } from '../components/Layout.tsx'
import { PhotoField } from '../components/PhotoField.tsx'
import { Sheet } from '../components/Sheet.tsx'
import { Stepper } from '../components/Stepper.tsx'
import {
  inUseCount,
  isUncountedOnHives,
  typeOnStacksCount,
  unusedCount,
} from '../domain/inventory.ts'
import type { EquipmentGroup, FrameTotal } from '../domain/types.ts'
import { useStore } from '../state/context.ts'

export function StockScreen({ typeId }: { typeId: string }) {
  const { state, dispatch, inUse, go, photos, setTypePhoto, route } = useStore()
  const type = state.equipmentTypes.find((item) => item.id === typeId)
  const lockedGroup =
    route.page === 'stock' && route.typeId === 'new' ? route.group : undefined
  const [newName, setNewName] = useState('')
  const [newGroup, setNewGroup] = useState<EquipmentGroup>(
    lockedGroup ?? 'other',
  )
  const [newOwned, setNewOwned] = useState(0)
  const [newPhoto, setNewPhoto] = useState<string | null>(null)
  const [newFrameTotal, setNewFrameTotal] = useState<FrameTotal>(null)
  const [editingOwned, setEditingOwned] = useState(false)
  const [ownedDraft, setOwnedDraft] = useState('')
  const [draftTypeId, setDraftTypeId] = useState(
    typeId === 'new' ? `new:${lockedGroup ?? ''}` : typeId,
  )
  const [confirmDelete, setConfirmDelete] = useState(false)
  const formKey = typeId === 'new' ? `new:${lockedGroup ?? ''}` : typeId
  if (draftTypeId !== formKey) {
    setDraftTypeId(formKey)
    setEditingOwned(false)
    setOwnedDraft('')
    setConfirmDelete(false)
    setNewName('')
    setNewOwned(0)
    setNewPhoto(null)
    setNewFrameTotal(null)
    setNewGroup(lockedGroup ?? 'other')
  }

  if (typeId === 'new') {
    const section = lockedGroup ?? newGroup
    return (
      <Layout
        title={lockedGroup ? ADD_TO_LABELS[lockedGroup] : 'Add a type'}
        subtitle="Name and how many you own. A photo is optional. 0 is fine until you have counted."
        back={{ label: 'Unused kit', href: '#/unused' }}
      >
        {lockedGroup ? (
          <p className="lede">
            This goes in {GROUP_LABELS[lockedGroup]}.
          </p>
        ) : (
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
        )}
        <label className="field">
          <span>Name</span>
          <input
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder={nameHint(section)}
            autoComplete="off"
          />
        </label>
        <div className="card">
          <div className="card-row">
            <div>
              <p className="card-kicker">Owned count</p>
              <p className="card-copy">How many of this type you have. Leave 0 until you count.</p>
            </div>
            <Stepper
              label="owned count"
              value={newOwned}
              max={999}
              onChange={setNewOwned}
            />
          </div>
        </div>
        <div className="card">
          <p className="card-kicker">Photo (optional)</p>
          <PhotoField
            photo={newPhoto ?? undefined}
            onChange={(dataUrl) => setNewPhoto(dataUrl)}
            onRemove={() => setNewPhoto(null)}
            addLabel="Add your photo of this part"
          />
        </div>
        {section === 'frames' ? (
          <fieldset className="field">
            <legend>Counts towards frame totals (optional)</legend>
            <div className="segment wrap-segment">
              <button
                type="button"
                className={newFrameTotal === null ? 'is-on' : ''}
                onClick={() => setNewFrameTotal(null)}
              >
                Neither
              </button>
              <button
                type="button"
                className={newFrameTotal === 'deep' ? 'is-on' : ''}
                onClick={() => setNewFrameTotal('deep')}
              >
                Deep frames total
              </button>
              <button
                type="button"
                className={newFrameTotal === 'shallow' ? 'is-on' : ''}
                onClick={() => setNewFrameTotal('shallow')}
              >
                Shallow frames total
              </button>
            </div>
          </fieldset>
        ) : null}
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
              group: section,
              unit: defaultUnitForGroup(section),
              frameTotal: section === 'frames' ? newFrameTotal : null,
              owned: newOwned,
            })
            if (newPhoto) setTypePhoto(id, newPhoto)
            go({ page: 'unused' })
          }}
        >
          Add type
        </button>
      </Layout>
    )
  }

  if (!type) {
    return (
      <Layout title="Unknown type" back={{ label: 'Unused kit', href: '#/unused' }}>
        <p className="lede">That kit type is not in this list.</p>
      </Layout>
    )
  }

  const owned = state.owned[type.id] ?? 0
  const used = inUseCount(inUse, type.id)
  const unused = unusedCount(owned, used)
  const free = Math.max(0, unused)
  const onStacks = typeOnStacksCount(state.hives, type.id)

  return (
    <Layout
      title={type.name}
      subtitle="Edit this type, type how many you own, or delete it. Unused is owned minus what is on hive stacks. 0 means not counted yet."
      back={{ label: 'Unused kit', href: '#/unused' }}
    >
      <div className="stat-card">
        <div className="stat-with-thumb">
          <KitThumb typeId={type.id} photo={photos.types[type.id]} />
          <div>
            <p className="stat-label">Unused</p>
            <p className={owned > 0 && unused < 0 ? 'stat-num is-short' : 'stat-num'}>
              {free}
            </p>
            <p className="stat-sub">
              {owned} owned · {used} on hives
              {type.unit ? ` · ${type.unit}` : ''}
            </p>
          </div>
        </div>
        <PhotoField
          photo={photos.types[type.id]}
          onChange={(dataUrl) => setTypePhoto(type.id, dataUrl)}
          onRemove={() => setTypePhoto(type.id, null)}
          addLabel="Add your photo of this part"
        />
      </div>

      <div className="card">
        <p className="card-kicker">This type</p>
        <label className="field">
          <span>Name</span>
          <input
            value={type.name}
            onChange={(event) =>
              dispatch({
                type: 'update-equipment-type',
                typeId: type.id,
                name: event.target.value,
              })
            }
            autoComplete="off"
          />
        </label>
        <label className="field">
          <span>Section</span>
          <select
            value={type.group}
            onChange={(event) =>
              dispatch({
                type: 'update-equipment-type',
                typeId: type.id,
                group: event.target.value as EquipmentGroup,
              })
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
          <span>Unit (optional)</span>
          <input
            value={type.unit}
            onChange={(event) =>
              dispatch({
                type: 'update-equipment-type',
                typeId: type.id,
                unit: event.target.value,
              })
            }
            placeholder="e.g. boxes, frames, each"
            autoComplete="off"
          />
        </label>
        <fieldset className="field">
          <legend>Counts towards frame totals</legend>
          <div className="segment wrap-segment">
            <button
              type="button"
              className={type.frameTotal === null ? 'is-on' : ''}
              onClick={() =>
                dispatch({
                  type: 'update-equipment-type',
                  typeId: type.id,
                  frameTotal: null,
                })
              }
            >
              Neither
            </button>
            <button
              type="button"
              className={type.frameTotal === 'deep' ? 'is-on' : ''}
              onClick={() =>
                dispatch({
                  type: 'update-equipment-type',
                  typeId: type.id,
                  frameTotal: 'deep',
                })
              }
            >
              Deep frames total
            </button>
            <button
              type="button"
              className={type.frameTotal === 'shallow' ? 'is-on' : ''}
              onClick={() =>
                dispatch({
                  type: 'update-equipment-type',
                  typeId: type.id,
                  frameTotal: 'shallow',
                })
              }
            >
              Shallow frames total
            </button>
          </div>
        </fieldset>
      </div>

      {type.id === BOTTOM_BOARD || type.id === WOODEN_LID ? (
        <div className="banner">
          <p>
            Bottom boards and wooden lids on the garage pads stay with those pads.
            They are not this unused stock, and they cannot be moved to the L-yard
            or the far-side hive. Only add a number here if you own extra pieces
            besides those pads.
            {type.id === BOTTOM_BOARD
              ? ' Two spare unused bottom boards at start. They are not auto-assigned onto the L-yard hives.'
              : ''}
          </p>
        </div>
      ) : null}

      {type.id === INNER_COVER ? (
        <div className="banner">
          <p>
            Every hive needs an inner cover. Two spare unused covers sit in
            Unused at start. They are not auto-assigned onto the L-yard hives.
          </p>
        </div>
      ) : null}

      {type.id === METAL_LID ? (
        <div className="banner">
          <p>
            Seven metal lids are on the L-yard full-size hives at start. Five are
            spare. The outdoor nucs and the far-side nuc still need a lid chosen —
            no extra metal lids were assumed for them.
          </p>
        </div>
      ) : null}

      {type.id === DEEP_USED_FRAME ? (
        <div className="banner">
          <p>These 50 are deep used frames. They are not mixed with the spring lots.</p>
        </div>
      ) : null}

      {type.id === WAXED_SPRING_FRAME ? (
        <div className="banner">
          <p>
            New waxed frames ready for spring. Some are deep and some are
            shallow. Shown as one lot of 50 — no invented deep/shallow counts.
          </p>
        </div>
      ) : null}

      {type.id === UNBUILT_SPRING_FRAME ? (
        <div className="banner">
          <p>
            Unbuilt frames ready for spring. Still a mix; more detail has not
            been given. Shown as one lot of 50 — no deep/shallow split invented.
          </p>
        </div>
      ) : null}

      {type.id === SHALLOW_FRAME ? (
        <div className="banner">
          <p>
            Shallows in the waxed lot (and any in the unbuilt lot) have not been
            counted separately. This row stays at 0 until you type a number. It
            is not a split of the spring lots and not a claim that there are no
            shallow frames.
          </p>
        </div>
      ) : null}

      {isUncountedOnHives(owned, used) ? (
        <div className="banner">
          <p>
            {used} are on hives. Owned is still 0 because it has not been
            counted. Type a number when you have one — this is not a blocker.
          </p>
        </div>
      ) : used > owned ? (
        <div className="banner">
          <p>
            {used} are on hives, and owned is {owned}. Type a different number
            if that owned count is wrong. The app will not invent one.
          </p>
        </div>
      ) : null}

      <div className="card">
        <div className="card-row">
          <div>
            <p className="card-kicker">Owned stock</p>
            <p className="card-copy">
              How many of this type you have in total. Leave 0 until you count.
            </p>
          </div>
          <Stepper
            label="owned stock"
            value={owned}
            max={999}
            onChange={(value) =>
              dispatch({ type: 'set-owned', typeId: type.id, owned: value })
            }
          />
        </div>
        <label className="field tight">
          <span>Type a number</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={editingOwned ? ownedDraft : String(owned)}
            onFocus={() => {
              setEditingOwned(true)
              setOwnedDraft(String(owned))
            }}
            onChange={(event) => {
              const raw = event.target.value
              setOwnedDraft(raw)
              if (raw === '') return
              const next = Number(raw)
              if (!Number.isFinite(next) || next < 0) return
              dispatch({
                type: 'set-owned',
                typeId: type.id,
                owned: Math.round(next),
              })
            }}
            onBlur={() => {
              setEditingOwned(false)
              setOwnedDraft('')
            }}
          />
        </label>
      </div>

      <button
        className="danger-text"
        type="button"
        onClick={() => setConfirmDelete(true)}
      >
        Delete this type
      </button>

      {confirmDelete ? (
        <Sheet title="Delete this type?" onClose={() => setConfirmDelete(false)}>
          {onStacks > 0 ? (
            <p className="sheet-lede">
              {type.name} is on {onStacks} hive stack piece
              {onStacks === 1 ? '' : 's'}. Take those pieces off the stacks and
              delete the type? This does not add extra unused stock — the type
              and its owned number leave the list.
            </p>
          ) : (
            <p className="sheet-lede">
              Delete {type.name} from your list? Owned count {owned} will be
              removed with it. This does not invent stock.
            </p>
          )}
          <button
            className="danger"
            type="button"
            onClick={() => {
              dispatch({
                type: 'remove-equipment-type',
                typeId: type.id,
                stripFromStacks: onStacks > 0,
              })
              setTypePhoto(type.id, null)
              setConfirmDelete(false)
              go({ page: 'unused' })
            }}
          >
            {onStacks > 0 ? 'Take off hives and delete' : 'Delete type'}
          </button>
        </Sheet>
      ) : null}
    </Layout>
  )
}

function nameHint(group: EquipmentGroup): string {
  if (group === 'hive-boxes') return 'e.g. 8-frame nuc box'
  if (group === 'frames') return 'e.g. Deep frames, new waxed'
  if (group === 'tops-and-bottoms') return 'e.g. Crown board'
  return 'e.g. Queen excluder'
}
