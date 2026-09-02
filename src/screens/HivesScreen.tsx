import { Layout } from '../components/Layout.tsx'
import { METAL_LID } from '../domain/equipment.ts'
import { hiveKindLabel } from '../domain/names.ts'
import { countRole } from '../domain/stack.ts'
import { useStore } from '../state/context.ts'

export function HivesScreen() {
  const { state, go } = useStore()

  return (
    <Layout
      title="Hives"
      subtitle="Every hive and nuc, grouped by site. Empty pads live on the site aerials, not here."
    >
      {state.sites.map((site) => {
        const hives = state.hives.filter((hive) => hive.siteId === site.id)
        return (
          <section key={site.id} className="group">
            <div className="group-head">
              <h2>{site.name}</h2>
              <a href={`#/sites/${site.id}`}>Aerial</a>
            </div>
            {hives.length === 0 ? (
              <p className="empty">No hives on this site. Empty pads, if any, are on the aerial.</p>
            ) : (
              <ul className="hive-list">
                {hives.map((hive) => {
                  const brood = countRole(hive.stack, 'brood')
                  const supers = countRole(hive.stack, 'super')
                  const nucs = countRole(hive.stack, 'nuc-box')
                  let detail = 'Stack not set'
                  if (hive.padId) {
                    const pad = state.pads.find((item) => item.id === hive.padId)
                    if (pad?.lockedBottomAndLid && hive.stack.length === 0) {
                      detail = 'Pad bottom and wooden lid · stack not set'
                    }
                  }
                  if (hive.kind === 'full-size' && hive.stack.length > 0) {
                    const bits = []
                    if (brood) bits.push(`${brood} brood`)
                    if (supers) bits.push(`${supers} super${supers === 1 ? '' : 's'}`)
                    const lid = hive.stack.find((layer) => layer.role === 'lid')
                    if (lid && !brood && !supers) {
                      bits.push(
                        lid.typeId === METAL_LID ? 'Metal lid · brood not set' : 'Lid · brood not set',
                      )
                    }
                    if (bits.length === 0) {
                      bits.push(`${hive.stack.length} piece${hive.stack.length === 1 ? '' : 's'}`)
                    }
                    detail = bits.join(' · ')
                  } else if (hive.kind !== 'full-size' && nucs > 0) {
                    detail = `${nucs} nuc box${nucs === 1 ? '' : 'es'}`
                  } else if (hive.stack.length > 0) {
                    detail = `${hive.stack.length} piece${hive.stack.length === 1 ? '' : 's'}`
                  }
                  return (
                    <li key={hive.id}>
                      <button
                        type="button"
                        className="hive-row"
                        onClick={() => go({ page: 'hive', hiveId: hive.id })}
                      >
                        <span className={`hive-icon ${hive.kind === 'full-size' ? 'is-full' : 'is-nuc'}`} />
                        <span>
                          <span className="hive-name">{hive.name}</span>
                          <span className="hive-meta">
                            {hiveKindLabel(hive.kind)} · {detail}
                          </span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        )
      })}
    </Layout>
  )
}
