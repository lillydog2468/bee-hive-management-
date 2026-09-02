import { useState } from 'react'
import { BOTTOM_BOARD, DEEP_USED_FRAME, INNER_COVER, METAL_LID, SHALLOW_FRAME, UNBUILT_SPRING_FRAME, WAXED_SPRING_FRAME, WOODEN_LID } from '../domain/equipment.ts'
import { KitThumb } from '../components/KitIllustration.tsx'
import { Layout } from '../components/Layout.tsx'
import { PhotoField } from '../components/PhotoField.tsx'
import { Stepper } from '../components/Stepper.tsx'
import { inUseCount, isUncountedOnHives, unusedCount } from '../domain/inventory.ts'
import { useStore } from '../state/context.ts'

export function StockScreen({ typeId }: { typeId: string }) {
  const { state, dispatch, inUse, go, photos, setTypePhoto } = useStore()
  const type = state.equipmentTypes.find((item) => item.id === typeId)
  const [newName, setNewName] = useState('')
  const [editingOwned, setEditingOwned] = useState(false)
  const [ownedDraft, setOwnedDraft] = useState('')
  const [draftTypeId, setDraftTypeId] = useState(typeId)
  if (draftTypeId !== typeId) {
    setDraftTypeId(typeId)
    setEditingOwned(false)
    setOwnedDraft('')
  }

  if (typeId === 'new') {
    return (
      <Layout
        title="Add a type"
        subtitle="Add a type when you want to count it. 0 is fine until you have a number."
        back={{ label: 'Unused kit', href: '#/unused' }}
      >
        <label className="field">
          <span>Name</span>
          <input
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="e.g. Queen excluder"
            autoComplete="off"
          />
        </label>
        <button
          className="primary"
          type="button"
          disabled={!newName.trim()}
          onClick={() => {
            const id = `custom-${crypto.randomUUID()}`
            dispatch({ type: 'add-equipment-type', id, name: newName.trim() })
            go({ page: 'stock', typeId: id })
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

  return (
    <Layout
      title={type.name}
      subtitle="Type how many you own when you have counted. Unused is owned minus what is on hive stacks. 0 means not counted yet."
      back={{ label: 'Unused kit', href: '#/unused' }}
    >
      <div className="stat-card">
        <div className="stat-with-thumb">
          <KitThumb typeId={type.id} photo={photos.types[type.id]} />
          <div>
            <p className="stat-label">Unused</p>
            <p className={owned > 0 && unused < 0 ? 'stat-num is-short' : 'stat-num'}>{free}</p>
            <p className="stat-sub">
              {owned} owned · {used} on hives
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

      {type.id === BOTTOM_BOARD || type.id === WOODEN_LID ? (
        <div className="banner">
          <p>
            Bottom boards and wooden lids on the garage pads stay with those pads.
            They are not this unused stock, and they cannot be moved to the L-yard or
            the far-side hive. Only add a number here if you own extra pieces besides
            those pads.
            {type.id === BOTTOM_BOARD
              ? ' Two spare unused bottom boards. They are not auto-assigned onto the L-yard hives.'
              : ''}
          </p>
        </div>
      ) : null}

      {type.id === INNER_COVER ? (
        <div className="banner">
          <p>
            Every hive needs an inner cover. Two spare unused covers sit in
            Unused. They are not auto-assigned onto the L-yard hives.
          </p>
        </div>
      ) : null}

      {type.id === METAL_LID ? (
        <div className="banner">
          <p>
            Seven metal lids are on the L-yard full-size hives. Five are spare.
            The outdoor nucs and the far-side nuc still need a lid chosen — no
            extra metal lids were assumed for them.
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

      {!type.builtIn && used === 0 ? (
        <button
          className="danger-text"
          type="button"
          onClick={() => {
            dispatch({ type: 'remove-equipment-type', typeId: type.id })
            go({ page: 'unused' })
          }}
        >
          Remove this type
        </button>
      ) : null}
    </Layout>
  )
}
