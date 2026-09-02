import { useState } from 'react'
import { Layout } from '../components/Layout.tsx'
import { Stepper } from '../components/Stepper.tsx'
import { formatUkDate, todayInPrague } from '../domain/dates.ts'
import {
  boxChoicesForHive,
  colourLabel,
  markedLabel,
  OBSERVATION_FIELDS,
  QUEEN_MARK_COLOURS,
  sortInspectionsNewestFirst,
  type ObservationKey,
} from '../domain/inspection.ts'
import { hiveKindLabel, padSizeLabel } from '../domain/names.ts'
import type {
  Inspection,
  QueenMarkColour,
  QueenMarked,
} from '../domain/types.ts'
import { useStore } from '../state/context.ts'

const emptyObservations: Record<ObservationKey, boolean> = {
  eggs: false,
  larvae: false,
  cappedBrood: false,
  droneCells: false,
  queenCells: false,
}

export function HiveInspectScreen({ hiveId }: { hiveId: string }) {
  const { state, dispatch, go } = useStore()
  const hive = state.hives.find((item) => item.id === hiveId)
  const [date, setDate] = useState(todayInPrague)
  const [strength, setStrength] = useState<1 | 2 | 3 | 4 | 5 | null>(null)
  const [observations, setObservations] = useState({ ...emptyObservations })
  const [queenSeen, setQueenSeen] = useState<boolean | null>(null)
  const [queenMarked, setQueenMarked] = useState<QueenMarked>('unknown')
  const [colour, setColour] = useState<QueenMarkColour | null>(null)
  const [notes, setNotes] = useState('')
  const [boxTypeId, setBoxTypeId] = useState<string | null>(null)
  const [frameTypeId, setFrameTypeId] = useState<string | null>(null)
  const [frameCount, setFrameCount] = useState(0)
  const [destPadId, setDestPadId] = useState<string | null>(null)

  if (!hive) {
    return (
      <Layout
        title="Unknown hive"
        back={{ label: 'Inspections', href: '#/inspections' }}
      >
        <p className="lede">That hive is not in this list.</p>
      </Layout>
    )
  }

  const site = state.sites.find((item) => item.id === hive.siteId)
  const boxes = boxChoicesForHive(hive.kind)
  const frameTypes = state.equipmentTypes.filter((type) => type.group === 'frames')
  const emptyPads = state.pads.filter((pad) => !pad.occupiedHiveId)
  const history = sortInspectionsNewestFirst(hive.inspections)
  const canSave = Boolean(date) && strength !== null && queenSeen !== null

  function resetForm() {
    setDate(todayInPrague())
    setStrength(null)
    setObservations({ ...emptyObservations })
    setQueenSeen(null)
    setQueenMarked('unknown')
    setColour(null)
    setNotes('')
    setBoxTypeId(null)
    setFrameTypeId(null)
    setFrameCount(0)
    setDestPadId(null)
  }

  function save() {
    if (strength === null || queenSeen === null || !hive) return
    dispatch({
      type: 'add-inspection',
      hiveId: hive.id,
      id: crypto.randomUUID(),
      date,
      strength,
      eggs: observations.eggs,
      larvae: observations.larvae,
      cappedBrood: observations.cappedBrood,
      droneCells: observations.droneCells,
      queenCells: observations.queenCells,
      queenSeen,
      queenMarked,
      queenMarkColour: colour,
      notes,
      addedBoxTypeId: boxTypeId,
      addedFrameTypeId: frameCount > 0 ? frameTypeId : null,
      addedFrameCount: frameCount,
      destPadId,
      splitId: crypto.randomUUID(),
      newHiveId: crypto.randomUUID(),
    })
    resetForm()
  }

  return (
    <Layout
      title={hive.name}
      subtitle={`${hiveKindLabel(hive.kind)} · ${site?.name ?? 'Unknown site'}`}
      back={{ label: 'Inspections', href: '#/inspections' }}
      actions={
        <button
          className="text-btn"
          type="button"
          onClick={() => go({ page: 'hive', hiveId: hive.id })}
        >
          Hive
        </button>
      }
    >
      <section className="card stack-card">
        <h2>Log inspection</h2>
        <p className="card-copy">
          Date defaults to today. Tick only what you saw. Adding a box or frames
          updates the hive stack and unused kit. A split uses an empty pad.
        </p>

        <label className="field">
          <span>Date</span>
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </label>

        <h3 className="sheet-sub">Strength</h3>
        <div className="segment">
          {([1, 2, 3, 4, 5] as const).map((value) => (
            <button
              key={value}
              type="button"
              className={strength === value ? 'is-on' : ''}
              onClick={() => setStrength(value)}
            >
              {value}
            </button>
          ))}
        </div>

        <h3 className="sheet-sub">Visible</h3>
        {OBSERVATION_FIELDS.map((field) => (
          <label key={field.key} className="toggle-row">
            <span>{field.label}</span>
            <input
              type="checkbox"
              checked={observations[field.key]}
              onChange={(event) =>
                setObservations((current) => ({
                  ...current,
                  [field.key]: event.target.checked,
                }))
              }
            />
          </label>
        ))}

        <h3 className="sheet-sub">Spotted the queen</h3>
        <div className="segment">
          <button
            type="button"
            className={queenSeen === true ? 'is-on' : ''}
            onClick={() => setQueenSeen(true)}
          >
            Yes
          </button>
          <button
            type="button"
            className={queenSeen === false ? 'is-on' : ''}
            onClick={() => setQueenSeen(false)}
          >
            No
          </button>
        </div>

        <h3 className="sheet-sub">Was she marked</h3>
        <div className="segment">
          <button
            type="button"
            className={queenMarked === 'yes' ? 'is-on' : ''}
            onClick={() => setQueenMarked('yes')}
          >
            Yes
          </button>
          <button
            type="button"
            className={queenMarked === 'no' ? 'is-on' : ''}
            onClick={() => {
              setQueenMarked('no')
              setColour(null)
            }}
          >
            No
          </button>
          <button
            type="button"
            className={queenMarked === 'unknown' ? 'is-on' : ''}
            onClick={() => {
              setQueenMarked('unknown')
              setColour(null)
            }}
          >
            Unknown
          </button>
        </div>

        {queenMarked === 'yes' ? (
          <>
            <h3 className="sheet-sub">Mark colour</h3>
            <div className="segment colour-segment">
              <button
                type="button"
                className={colour === null ? 'is-on' : ''}
                onClick={() => setColour(null)}
              >
                Not recorded
              </button>
              {QUEEN_MARK_COLOURS.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={colour === item ? 'is-on' : ''}
                  onClick={() => setColour(item)}
                >
                  <span className={`colour-dot is-${item}`} />
                  {colourLabel(item)}
                </button>
              ))}
            </div>
          </>
        ) : null}

        <h3 className="sheet-sub">Add a box</h3>
        <p className="card-copy">Optional. One extra box on this hive.</p>
        <div className="segment">
          <button
            type="button"
            className={boxTypeId === null ? 'is-on' : ''}
            onClick={() => setBoxTypeId(null)}
          >
            None
          </button>
          {boxes.map((choice) => (
            <button
              key={choice.id}
              type="button"
              className={boxTypeId === choice.id ? 'is-on' : ''}
              onClick={() => setBoxTypeId(choice.id)}
            >
              {choice.label}
            </button>
          ))}
        </div>

        <h3 className="sheet-sub">Add frames</h3>
        <p className="card-copy">Optional. Taken from unused kit.</p>
        <div className="segment wrap-segment">
          <button
            type="button"
            className={frameTypeId === null ? 'is-on' : ''}
            onClick={() => {
              setFrameTypeId(null)
              setFrameCount(0)
            }}
          >
            None
          </button>
          {frameTypes.map((type) => (
            <button
              key={type.id}
              type="button"
              className={frameTypeId === type.id ? 'is-on' : ''}
              onClick={() => {
                setFrameTypeId(type.id)
                if (frameCount === 0) setFrameCount(1)
              }}
            >
              {type.shortName}
            </button>
          ))}
        </div>
        {frameTypeId ? (
          <Stepper
            label="frames to add"
            value={frameCount}
            min={0}
            max={50}
            onChange={setFrameCount}
          />
        ) : null}

        <h3 className="sheet-sub">Make a split</h3>
        <p className="card-copy">
          Optional. Occupies an empty pad from this hive, same as the hive split
          log.
        </p>
        {emptyPads.length === 0 ? (
          <p className="card-copy">
            No empty pad yet. Add one on a site aerial, then come back.
          </p>
        ) : (
          <div className="choice-list">
            <button
              type="button"
              className={destPadId === null ? 'is-on' : ''}
              onClick={() => setDestPadId(null)}
            >
              No split
            </button>
            {state.sites.map((item) => {
              const pads = emptyPads.filter((pad) => pad.siteId === item.id)
              return pads.map((pad) => (
                <button
                  key={pad.id}
                  type="button"
                  className={destPadId === pad.id ? 'is-on' : ''}
                  onClick={() => setDestPadId(pad.id)}
                >
                  {item.name} · {pad.name}
                  <span>Empty {padSizeLabel(pad.size).toLowerCase()}</span>
                </button>
              ))
            })}
          </div>
        )}

        <label className="field">
          <span>Notes (optional)</span>
          <textarea
            className="notes-input"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            maxLength={400}
            placeholder="Anything else you want to remember"
          />
        </label>

        <button
          className="primary"
          type="button"
          disabled={!canSave}
          onClick={save}
        >
          Save inspection
        </button>
      </section>

      <section className="card">
        <h2>Past inspections</h2>
        {history.length === 0 ? (
          <p className="card-copy">No inspections logged yet.</p>
        ) : (
          <ul className="inspect-list">
            {history.map((entry) => (
              <InspectionCard
                key={entry.id}
                entry={entry}
                splitLabel={splitLabel(state, entry.splitId)}
                boxName={
                  state.equipmentTypes.find(
                    (type) => type.id === entry.addedBoxTypeId,
                  )?.shortName
                }
                frameName={
                  state.equipmentTypes.find(
                    (type) => type.id === entry.addedFrameTypeId,
                  )?.shortName
                }
              />
            ))}
          </ul>
        )}
      </section>
    </Layout>
  )
}

function splitLabel(
  state: { splits: { id: string; destName: string; destSiteName: string }[] },
  splitId: string | null,
): string | null {
  if (!splitId) return null
  const split = state.splits.find((item) => item.id === splitId)
  if (!split) return 'Split'
  return `Split to ${split.destName} (${split.destSiteName})`
}

function InspectionCard({
  entry,
  splitLabel: split,
  boxName,
  frameName,
}: {
  entry: Inspection
  splitLabel: string | null
  boxName?: string
  frameName?: string
}) {
  const seen = OBSERVATION_FIELDS.filter((field) => entry[field.key]).map(
    (field) => field.label,
  )
  const actions = [
    boxName ? `Added ${boxName}` : '',
    entry.addedFrameCount > 0 && frameName
      ? `Added ${entry.addedFrameCount} ${frameName}`
      : '',
    split ?? '',
  ].filter(Boolean)

  return (
    <li className="inspect-card">
      <p className="inspect-date">{formatUkDate(entry.date)}</p>
      <p>Strength {entry.strength}</p>
      <p className="card-copy">
        {seen.length > 0 ? seen.join(' · ') : 'Nothing ticked as visible'}
      </p>
      <p className="card-copy">
        Queen {entry.queenSeen ? 'seen' : 'not seen'}
        {' · '}
        mark {markedLabel(entry.queenMarked).toLowerCase()}
        {entry.queenMarked === 'yes' && entry.queenMarkColour
          ? ` · ${colourLabel(entry.queenMarkColour).toLowerCase()}`
          : entry.queenMarked === 'yes'
            ? ' · colour not recorded'
            : ''}
      </p>
      {actions.length > 0 ? (
        <p className="card-copy">{actions.join(' · ')}</p>
      ) : null}
      {entry.notes ? <p>{entry.notes}</p> : null}
    </li>
  )
}
