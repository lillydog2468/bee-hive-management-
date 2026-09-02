import { useState } from 'react'
import { BOTTOM_BOARD, DEEP_USED_FRAME, INNER_COVER, METAL_LID, SHALLOW_FRAME, UNBUILT_SPRING_FRAME, WAXED_SPRING_FRAME, WOODEN_LID } from '../domain/equipment.ts'
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
            counted separately. This row stays at 0. It is not a split of the
            spring lots and not a claim that there are no shallow frames.
          </p>
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
