import { Layout } from '../components/Layout.tsx'
import {
  allInspections,
  hivesPerSite,
  observationCounts,
  queenStats,
  syrupByDate,
  unusedSpotlight,
} from '../domain/analytics.ts'
import { formatLitres, formatUkDate } from '../domain/dates.ts'
import {
  colourLabel,
  OBSERVATION_FIELDS,
  QUEEN_MARK_COLOURS,
} from '../domain/inspection.ts'
import { useStore } from '../state/context.ts'

export function AnalyticsScreen() {
  const { state } = useStore()
  const rows = allInspections(state)
  const observations = observationCounts(rows)
  const queens = queenStats(rows)
  const syrup = syrupByDate(state)
  const yards = hivesPerSite(state)
  const unused = unusedSpotlight(state)
  const maxStrength = 5
  const maxUnused = Math.max(1, ...unused.map((row) => Math.abs(row.unused)))
  const maxYard = Math.max(1, ...yards.map((row) => row.count))
  const maxSyrup = Math.max(1, ...syrup.map((row) => row.litres))
  const maxObs = Math.max(1, ...OBSERVATION_FIELDS.map((field) => observations[field.key]))

  return (
    <Layout
      title="Analytics"
      subtitle="Only numbers from what you have logged. Nothing is filled in for you."
    >
      <section className="card">
        <h2>Hives per yard</h2>
        <BarList
          rows={yards.map((row) => ({
            label: row.name,
            value: row.count,
            max: maxYard,
          }))}
        />
      </section>

      <section className="card">
        <h2>Unused kit</h2>
        {unused.length === 0 ? (
          <p className="card-copy">No unused (or short) counts to show.</p>
        ) : (
          <BarList
            rows={unused.map((row) => ({
              label: row.name,
              value: row.unused,
              max: maxUnused,
            }))}
          />
        )}
      </section>

      <section className="card">
        <h2>Colony strength</h2>
        {rows.length === 0 ? (
          <p className="card-copy">No inspections logged yet.</p>
        ) : (
          <BarList
            rows={rows.map((row) => ({
              label: `${formatUkDate(row.inspection.date)} · ${row.hiveName}`,
              value: row.inspection.strength,
              max: maxStrength,
              display: String(row.inspection.strength),
            }))}
          />
        )}
      </section>

      <section className="card">
        <h2>Visible in inspections</h2>
        {rows.length === 0 ? (
          <p className="card-copy">No inspections logged yet.</p>
        ) : (
          <BarList
            rows={OBSERVATION_FIELDS.map((field) => ({
              label: field.label,
              value: observations[field.key],
              max: maxObs,
            }))}
          />
        )}
      </section>

      <section className="card">
        <h2>Queen</h2>
        {rows.length === 0 ? (
          <p className="card-copy">No inspections logged yet.</p>
        ) : (
          <>
            <BarList
              rows={[
                { label: 'Spotted', value: queens.seen, max: rows.length },
                { label: 'Not spotted', value: queens.notSeen, max: rows.length },
                { label: 'Marked', value: queens.markedYes, max: rows.length },
                { label: 'Not marked', value: queens.markedNo, max: rows.length },
                { label: 'Mark unknown', value: queens.markedUnknown, max: rows.length },
              ]}
            />
            <h3 className="sheet-sub">Mark colour</h3>
            {QUEEN_MARK_COLOURS.every((colour) => queens.colours[colour] === 0) ? (
              <p className="card-copy">No mark colour recorded yet.</p>
            ) : (
              <BarList
                rows={QUEEN_MARK_COLOURS.map((colour) => ({
                  label: colourLabel(colour),
                  value: queens.colours[colour],
                  max: Math.max(1, queens.markedYes),
                }))}
              />
            )}
          </>
        )}
      </section>

      <section className="card">
        <h2>Sugar syrup</h2>
        {syrup.length === 0 ? (
          <p className="card-copy">No feedings logged yet.</p>
        ) : (
          <BarList
            rows={syrup.map((row) => ({
              label: formatUkDate(row.date),
              value: row.litres,
              max: maxSyrup,
              display: formatLitres(row.litres),
            }))}
          />
        )}
      </section>

      <section className="card">
        <h2>Splits</h2>
        {state.splits.length === 0 ? (
          <p className="card-copy">No splits logged yet.</p>
        ) : (
          <ul className="log-list">
            {[...state.splits]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((item) => (
                <li key={item.id}>
                  <span>
                    {formatUkDate(item.date)} · {item.sourceName} → {item.destName}{' '}
                    ({item.destSiteName})
                  </span>
                </li>
              ))}
          </ul>
        )}
      </section>
    </Layout>
  )
}

function BarList({
  rows,
}: {
  rows: { label: string; value: number; max: number; display?: string }[]
}) {
  return (
    <ul className="bar-list">
      {rows.map((row) => (
        <li key={row.label}>
          <div className="bar-meta">
            <span>{row.label}</span>
            <span>{row.display ?? row.value}</span>
          </div>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{
                width: `${Math.min(100, (Math.abs(row.value) / row.max) * 100)}%`,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
