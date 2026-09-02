import { HiveGlyph } from '../components/HiveGlyph.tsx'
import { Layout } from '../components/Layout.tsx'
import { formatUkDate } from '../domain/dates.ts'
import { sortInspectionsNewestFirst } from '../domain/inspection.ts'
import { hiveMapBoxCount, nucLinesFollowPath } from '../domain/mapGlyph.ts'
import { hiveKindLabel } from '../domain/names.ts'
import { useStore } from '../state/context.ts'

export function InspectionsScreen() {
  const { state, go } = useStore()

  return (
    <Layout
      title="Inspections"
      subtitle="Dated records per hive. Empty until you log one. Strength, brood you can see, the queen, and whether you added a box, frames, or made a split."
    >
      {state.sites.map((site) => {
        const hives = state.hives.filter((hive) => hive.siteId === site.id)
        if (hives.length === 0) return null
        return (
          <section key={site.id} className="group">
            <h2>{site.name}</h2>
            <ul className="hive-list">
              {hives.map((hive) => {
                const latest = sortInspectionsNewestFirst(hive.inspections)[0]
                return (
                  <li key={hive.id}>
                    <button
                      type="button"
                      className="hive-row"
                      onClick={() => go({ page: 'inspect', hiveId: hive.id })}
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
                          {hiveKindLabel(hive.kind)}
                          {latest
                            ? ` · ${formatUkDate(latest.date)} · strength ${latest.strength}`
                            : ' · No inspections yet'}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </Layout>
  )
}
