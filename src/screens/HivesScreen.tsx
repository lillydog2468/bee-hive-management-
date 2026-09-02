import { HiveGlyph } from '../components/HiveGlyph.tsx'
import { Layout } from '../components/Layout.tsx'
import { METAL_LID } from '../domain/equipment.ts'
import { hiveMapBoxCount, nucLinesFollowPath } from '../domain/mapGlyph.ts'
import { hiveKindLabel } from '../domain/names.ts'
import {
  hiveNeedsBottom,
  hiveNeedsInnerCover,
  hiveNeedsLidChoice,
} from '../domain/requiredParts.ts'
import { hasLockedBottomAndLid, hivePad } from '../domain/siteLocked.ts'
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
                  const pad = hivePad(state, hive)
                  const brood = countRole(hive.stack, 'brood')
                  const supers = countRole(hive.stack, 'super')
                  const nucs = countRole(hive.stack, 'nuc-box')
                  const bits: string[] = []
                  if (hasLockedBottomAndLid(pad)) {
                    bits.push('Pad bottom and wooden lid')
                  }
                  if (hive.kind === 'full-size') {
                    if (brood) bits.push(`${brood} brood`)
                    if (supers) bits.push(`${supers} super${supers === 1 ? '' : 's'}`)
                    if (!brood && !supers) {
                      const lid = hive.stack.find((layer) => layer.role === 'lid')
                      bits.push(
                        lid?.typeId === METAL_LID
                          ? 'Metal lid · brood not set'
                          : 'Brood not set',
                      )
                    }
                  } else if (nucs > 0) {
                    bits.push(`${nucs} nuc box${nucs === 1 ? '' : 'es'}`)
                  }
                  if (hiveNeedsBottom(hive, pad)) bits.push('Needs a bottom')
                  if (hiveNeedsInnerCover(hive)) bits.push('Needs an inner cover')
                  if (hiveNeedsLidChoice(hive, pad)) bits.push('Needs a lid')
                  const detail = bits.length > 0 ? bits.join(' · ') : 'Stack not set'
                  return (
                    <li key={hive.id}>
                      <button
                        type="button"
                        className="hive-row"
                        onClick={() => go({ page: 'hive', hiveId: hive.id })}
                      >
                        <span className="hive-icon-wrap">
                          <HiveGlyph
                            kind={hive.kind}
                            boxCount={hiveMapBoxCount(hive)}
                            rotate={nucLinesFollowPath(hive)}
                          />
                        </span>
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
