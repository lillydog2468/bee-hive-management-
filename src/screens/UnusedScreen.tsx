import { GROUP_LABELS, GROUP_ORDER } from '../domain/equipment.ts'
import { inUseCount, unusedCount } from '../domain/inventory.ts'
import { Layout } from '../components/Layout.tsx'
import { useStore } from '../state/context.ts'

export function UnusedScreen() {
  const { state, inUse, go } = useStore()
  const shortfalls = state.equipmentTypes.filter((type) => {
    const owned = state.owned[type.id] ?? 0
    return inUseCount(inUse, type.id) > owned
  })

  return (
    <Layout
      title="Unused kit"
      subtitle="Owned equipment that is not assigned to a hive stack. This is the number to trust when you want to know what is free."
    >
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
        const types = state.equipmentTypes.filter((type) => type.group === group)
        if (types.length === 0) return null
        return (
          <section key={group} className="group">
            <h2>{GROUP_LABELS[group]}</h2>
            <ul className="kit-list">
              {types.map((type) => {
                const owned = state.owned[type.id] ?? 0
                const used = inUseCount(inUse, type.id)
                const unused = unusedCount(owned, used)
                const free = Math.max(0, unused)
                return (
                  <li key={type.id}>
                    <button
                      type="button"
                      className="kit-row"
                      onClick={() => go({ page: 'stock', typeId: type.id })}
                    >
                      <span className="kit-copy">
                        <span className="kit-name">{type.name}</span>
                        <span className="kit-meta">
                          {owned} owned · {used} on hives
                          {used > owned ? ` · short by ${used - owned}` : ''}
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
              })}
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
