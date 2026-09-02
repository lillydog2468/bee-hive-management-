import { useState } from 'react'
import { BOTTOM_BOARD, FRAME_CONDITION_IDS, INNER_COVER, METAL_LID, SHALLOW_FRAME, WOODEN_LID } from '../domain/equipment.ts'
import { Layout } from '../components/Layout.tsx'
import { Stepper } from '../components/Stepper.tsx'
import { inUseCount, unusedCount } from '../domain/inventory.ts'
import { useStore } from '../state/context.ts'

export function StockScreen({ typeId }: { typeId: string }) {
  const { state, dispatch, inUse, go } = useStore()
  const type = state.equipmentTypes.find((item) => item.id === typeId)
  const [newName, setNewName] = useState('')

  if (typeId === 'new') {
    return (
      <Layout
        title="Add a type"
        subtitle="Only add a type you actually own or need to count. Do not duplicate the built-in list."
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
      subtitle="Set how many you own. Unused is owned minus what is currently on hive stacks."
      back={{ label: 'Unused kit', href: '#/unused' }}
    >
      <div className="stat-card">
        <p className="stat-label">Unused</p>
        <p className={unused < 0 ? 'stat-num is-short' : 'stat-num'}>{free}</p>
        <p className="stat-sub">
          {owned} owned · {used} on hives
        </p>
      </div>

      {type.id === BOTTOM_BOARD || type.id === WOODEN_LID ? (
        <div className="banner">
          <p>
            Bottom boards and wooden lids on the garage pads stay with those pads.
            They are not this unused stock, and they cannot be moved to the L-yard or
            the far-side hive. Only add a number here if you own extra pieces besides
            those pads.
            {type.id === BOTTOM_BOARD
              ? ' Every hive also needs a bottom board. Spare unused bottoms stay at 0 until a count is given.'
              : ''}
          </p>
        </div>
      ) : null}

      {type.id === INNER_COVER ? (
        <div className="banner">
          <p>
            Every hive needs an inner cover. How many spare ones you own has not
            been given, so unused stays 0 until you add a number.
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

      {(FRAME_CONDITION_IDS as readonly string[]).includes(type.id) ? (
        <div className="banner">
          <p>
            Frames are counted by condition, not as one pile. 50 deep used, 50
            waxed ready for spring, 50 unbuilt ready for spring. Only the used lot
            was named as deep. The other two were not named as deep or shallow.
          </p>
        </div>
      ) : null}

      {type.id === SHALLOW_FRAME ? (
        <div className="banner">
          <p>No shallow frame count has been given, so this starts at 0.</p>
        </div>
      ) : null}

      {used > owned ? (
        <div className="banner warn">
          <p>
            {used} are assigned to hives, but owned stock is {owned}. Add stock to
            match what you actually have — this app does not invent a count for you.
          </p>
        </div>
      ) : null}

      <div className="card">
        <div className="card-row">
          <div>
            <p className="card-kicker">Owned stock</p>
            <p className="card-copy">How many of this type you have in total.</p>
          </div>
          <Stepper
            label="owned stock"
            value={owned}
            onChange={(value) =>
              dispatch({ type: 'set-owned', typeId: type.id, owned: value })
            }
          />
        </div>
        <label className="field tight">
          <span>Or type a number</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={owned}
            onChange={(event) =>
              dispatch({
                type: 'set-owned',
                typeId: type.id,
                owned: Number(event.target.value) || 0,
              })
            }
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
