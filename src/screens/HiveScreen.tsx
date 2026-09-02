import { useState } from 'react'
import { HiveStack } from '../components/HiveStack.tsx'
import { Layout } from '../components/Layout.tsx'
import { Sheet } from '../components/Sheet.tsx'
import { Stepper } from '../components/Stepper.tsx'
import { METAL_LID, WOODEN_LID } from '../domain/equipment.ts'
import { hiveKindLabel } from '../domain/names.ts'
import { displayStack, hasLockedBottomAndLid, hivePad } from '../domain/siteLocked.ts'
import { countRole, hasRole, readingFeeding } from '../domain/stack.ts'
import type { FeedingConfig } from '../domain/types.ts'
import { useStore } from '../state/context.ts'

export function HiveScreen({ hiveId }: { hiveId: string }) {
  const { state, dispatch, go } = useStore()
  const hive = state.hives.find((item) => item.id === hiveId)
  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState(hive?.name ?? '')
  const [moveOpen, setMoveOpen] = useState(false)
  const [lidOpen, setLidOpen] = useState(false)
  const [extraOpen, setExtraOpen] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)

  if (!hive) {
    return (
      <Layout title="Unknown hive" back={{ label: 'Hives', href: '#/hives' }}>
        <p className="lede">That hive is not in this list.</p>
      </Layout>
    )
  }

  const site = state.sites.find((item) => item.id === hive.siteId)
  const pad = hivePad(state, hive)
  const lockedPad = hasLockedBottomAndLid(pad)
  const shown = displayStack(hive, pad)
  const brood = countRole(hive.stack, 'brood')
  const supers = countRole(hive.stack, 'super')
  const nucBoxes = countRole(hive.stack, 'nuc-box')
  const feeding = readingFeeding(hive.stack)
  const lid = shown.find((layer) => layer.role === 'lid')
  const extras = hive.stack.filter((layer) => layer.role === 'extra')

  function setFeeding(next: FeedingConfig | null) {
    dispatch({ type: 'set-feeding', hiveId: hive!.id, feeding: next })
  }

  function defaultFeeding(): FeedingConfig {
    return {
      feederBoxTypeId: 'shallow-box',
      feederTypeId: 'round-feeder',
      extraBodyTypeId: 'shallow-box',
    }
  }

  return (
    <Layout
      title={hive.name}
      subtitle={`${hiveKindLabel(hive.kind)} · ${site?.name ?? 'Unknown site'}`}
      back={{ label: 'Hives', href: '#/hives' }}
      actions={
        <button
          className="text-btn"
          type="button"
          onClick={() => {
            setName(hive.name)
            setRenaming(true)
          }}
        >
          Rename
        </button>
      }
    >
      <HiveStack stack={shown} types={state.equipmentTypes} />

      {hive.kind === 'full-size' ? (
        <section className="card stack-card">
          <h2>Brood chambers</h2>
          <p className="card-copy">
            Deep 10-frame boxes. Leave unset until you know whether this hive has one or two.
          </p>
          <div className="segment">
            <button
              type="button"
              className={brood === 0 ? 'is-on' : ''}
              onClick={() => dispatch({ type: 'set-brood', hiveId: hive.id, count: 0 })}
            >
              Not set
            </button>
            <button
              type="button"
              className={brood === 1 ? 'is-on' : ''}
              onClick={() => dispatch({ type: 'set-brood', hiveId: hive.id, count: 1 })}
            >
              1 deep
            </button>
            <button
              type="button"
              className={brood === 2 ? 'is-on' : ''}
              onClick={() => dispatch({ type: 'set-brood', hiveId: hive.id, count: 2 })}
            >
              2 deeps
            </button>
          </div>

          <h2>Honey supers</h2>
          <p className="card-copy">Shallow 10-frame boxes, added in spring as needed.</p>
          <Stepper
            label="honey supers"
            value={supers}
            onChange={(count) =>
              dispatch({ type: 'set-supers', hiveId: hive.id, count })
            }
          />
        </section>
      ) : (
        <section className="card stack-card">
          <h2>Nuc boxes</h2>
          <p className="card-copy">
            {hive.kind === 'nuc-4'
              ? '4-frame nuc boxes on this hive.'
              : '5-frame nuc boxes on this hive. Two boxes is 10 frames in total.'}
          </p>
          <Stepper
            label="nuc boxes"
            value={nucBoxes}
            min={0}
            max={6}
            onChange={(count) =>
              dispatch({ type: 'set-nuc-boxes', hiveId: hive.id, count })
            }
          />
        </section>
      )}

      <section className="card">
        <h2>Parts</h2>
        <ToggleRow
          label="Bottom board"
          on={lockedPad || hasRole(hive.stack, 'bottom')}
          locked={lockedPad}
          lockNote="This pad’s bottom board stays here. It is not unused kit."
          onToggle={(on) =>
            dispatch({ type: 'toggle-part', hiveId: hive.id, part: 'bottom', on })
          }
        />
        <ToggleRow
          label="Inner cover"
          on={hasRole(hive.stack, 'inner-cover')}
          onToggle={(on) =>
            dispatch({
              type: 'toggle-part',
              hiveId: hive.id,
              part: 'inner-cover',
              on,
            })
          }
        />
        <ToggleRow
          label={
            lockedPad
              ? 'Lid (wooden, stays on this pad)'
              : lid
                ? lid.typeId === METAL_LID
                  ? 'Lid (metal)'
                  : lid.typeId === WOODEN_LID
                    ? 'Lid (wooden)'
                    : 'Lid'
                : site?.lidTypeId === METAL_LID
                  ? 'Lid (metal on this site)'
                  : site?.lidTypeId === WOODEN_LID
                    ? 'Lid (wooden on this site)'
                    : 'Lid (type not set for this site)'
          }
          on={Boolean(lid)}
          locked={lockedPad}
          lockNote="This pad’s wooden lid stays here. It cannot be used on the L-yard or the far-side hive."
          onToggle={(on) => {
            if (!on) {
              dispatch({ type: 'toggle-part', hiveId: hive.id, part: 'lid', on: false })
              return
            }
            if (site?.lidTypeId) {
              dispatch({
                type: 'toggle-part',
                hiveId: hive.id,
                part: 'lid',
                on: true,
                lidTypeId: site.lidTypeId,
              })
              return
            }
            setLidOpen(true)
          }}
        />
      </section>

      <section className="card stack-card">
        <div className="card-row">
          <div>
            <h2>Summer feeding</h2>
            <p className="card-copy">
              Empty box on the inner cover with a round feeder or jar, then an extra body and lid so robbers and wasps cannot get in.
            </p>
          </div>
          <button
            type="button"
            className={feeding ? 'chip is-on' : 'chip'}
            onClick={() => setFeeding(feeding ? null : defaultFeeding())}
          >
            {feeding ? 'On' : 'Off'}
          </button>
        </div>
        {feeding ? (
          <>
            <h3 className="sheet-sub">Empty feeder box</h3>
            <div className="segment">
              <Choice
                on={feeding.feederBoxTypeId === 'shallow-box'}
                onClick={() =>
                  setFeeding({ ...feeding, feederBoxTypeId: 'shallow-box' })
                }
              >
                Shallow
              </Choice>
              <Choice
                on={feeding.feederBoxTypeId === 'deep-box'}
                onClick={() =>
                  setFeeding({ ...feeding, feederBoxTypeId: 'deep-box' })
                }
              >
                Deep
              </Choice>
            </div>
            <h3 className="sheet-sub">Feeder</h3>
            <div className="segment">
              <Choice
                on={feeding.feederTypeId === 'round-feeder'}
                onClick={() =>
                  setFeeding({ ...feeding, feederTypeId: 'round-feeder' })
                }
              >
                Round feeder
              </Choice>
              <Choice
                on={feeding.feederTypeId === 'feeding-jar'}
                onClick={() =>
                  setFeeding({ ...feeding, feederTypeId: 'feeding-jar' })
                }
              >
                Feeding jar
              </Choice>
            </div>
            <h3 className="sheet-sub">Extra body</h3>
            <div className="segment">
              <Choice
                on={feeding.extraBodyTypeId === 'shallow-box'}
                onClick={() =>
                  setFeeding({ ...feeding, extraBodyTypeId: 'shallow-box' })
                }
              >
                Shallow
              </Choice>
              <Choice
                on={feeding.extraBodyTypeId === 'deep-box'}
                onClick={() =>
                  setFeeding({ ...feeding, extraBodyTypeId: 'deep-box' })
                }
              >
                Deep
              </Choice>
            </div>
          </>
        ) : null}
      </section>

      <section className="card">
        <div className="card-row">
          <h2>Other kit on this hive</h2>
          <button className="text-btn" type="button" onClick={() => setExtraOpen(true)}>
            Add
          </button>
        </div>
        {extras.length === 0 ? (
          <p className="card-copy">Frames and anything else you want counted as in use.</p>
        ) : (
          <ul className="extra-list">
            {extras.map((layer) => {
              const type = state.equipmentTypes.find((item) => item.id === layer.typeId)
              return (
                <li key={layer.id}>
                  <span>{type?.name ?? layer.typeId}</span>
                  <button
                    type="button"
                    className="text-btn"
                    onClick={() =>
                      dispatch({
                        type: 'remove-layer',
                        hiveId: hive.id,
                        layerId: layer.id,
                      })
                    }
                  >
                    Return
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <div className="actions">
        <button className="secondary" type="button" onClick={() => setMoveOpen(true)}>
          Move to another site
        </button>
        {hive.stack.length > 0 ? (
          <button
            className="secondary"
            type="button"
            onClick={() => dispatch({ type: 'clear-stack', hiveId: hive.id })}
          >
            Return unused-pool kit
          </button>
        ) : null}
        <button className="danger-text" type="button" onClick={() => setConfirmRemove(true)}>
          Remove hive
        </button>
      </div>

      {renaming ? (
        <Sheet title="Rename" onClose={() => setRenaming(false)}>
          <label className="field">
            <span>Name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="off"
            />
          </label>
          <button
            className="primary"
            type="button"
            onClick={() => {
              dispatch({ type: 'rename-hive', hiveId: hive.id, name })
              setRenaming(false)
            }}
          >
            Save name
          </button>
        </Sheet>
      ) : null}

      {lidOpen ? (
        <Sheet title="Which lid?" onClose={() => setLidOpen(false)}>
          <p className="sheet-lede">This site has no lid type recorded. Choose metal or wooden — nothing is assumed.</p>
          <div className="choice-list">
            <button
              type="button"
              onClick={() => {
                dispatch({
                  type: 'toggle-part',
                  hiveId: hive.id,
                  part: 'lid',
                  on: true,
                  lidTypeId: METAL_LID,
                })
                setLidOpen(false)
              }}
            >
              Metal lid
            </button>
            <button
              type="button"
              onClick={() => {
                dispatch({
                  type: 'toggle-part',
                  hiveId: hive.id,
                  part: 'lid',
                  on: true,
                  lidTypeId: WOODEN_LID,
                })
                setLidOpen(false)
              }}
            >
              Wooden lid
            </button>
          </div>
        </Sheet>
      ) : null}

      {moveOpen ? (
        <Sheet title="Move hive" onClose={() => setMoveOpen(false)}>
          <p className="sheet-lede">
            Unused-pool kit stays on the hive. A garage pad’s bottom board and wooden lid stay on that pad.
          </p>
          <div className="choice-list">
            {state.sites.map((item) => {
              const emptyPads = state.pads.filter(
                (pad) => pad.siteId === item.id && !pad.occupiedHiveId,
              )
              return (
                <div key={item.id} className="move-site">
                  <button
                    type="button"
                    disabled={item.id === hive.siteId && !hive.padId}
                    onClick={() => {
                      dispatch({ type: 'move-hive', hiveId: hive.id, siteId: item.id })
                      setMoveOpen(false)
                    }}
                  >
                    {item.name}
                    {item.id === hive.siteId ? <span>Current site</span> : null}
                  </button>
                  {emptyPads.map((pad) => (
                    <button
                      key={pad.id}
                      type="button"
                      onClick={() => {
                        dispatch({
                          type: 'place-hive-on-pad',
                          hiveId: hive.id,
                          padId: pad.id,
                        })
                        setMoveOpen(false)
                      }}
                    >
                      {item.name} · {pad.name}
                    </button>
                  ))}
                </div>
              )
            })}
          </div>
        </Sheet>
      ) : null}

      {extraOpen ? (
        <Sheet title="Add kit to this hive" onClose={() => setExtraOpen(false)}>
          <div className="choice-list">
            {state.equipmentTypes
              .filter((type) => type.id !== 'bottom-board' && type.id !== 'wooden-lid')
              .map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => {
                  dispatch({
                    type: 'add-extra',
                    hiveId: hive.id,
                    extraId: crypto.randomUUID(),
                    typeId: type.id,
                  })
                  setExtraOpen(false)
                }}
              >
                {type.name}
              </button>
            ))}
          </div>
        </Sheet>
      ) : null}

      {confirmRemove ? (
        <Sheet title="Remove hive?" onClose={() => setConfirmRemove(false)}>
          <p className="sheet-lede">
            Unused-pool kit on this stack returns to unused. A garage pad’s bottom board and wooden lid stay on the pad.
          </p>
          <button
            className="danger"
            type="button"
            onClick={() => {
              dispatch({ type: 'remove-hive', hiveId: hive.id })
              go({ page: 'hives' })
            }}
          >
            Remove hive
          </button>
        </Sheet>
      ) : null}
    </Layout>
  )
}

function ToggleRow({
  label,
  on,
  onToggle,
  locked = false,
  lockNote,
}: {
  label: string
  on: boolean
  onToggle: (on: boolean) => void
  locked?: boolean
  lockNote?: string
}) {
  return (
    <label className={locked ? 'toggle-row is-locked' : 'toggle-row'}>
      <span>
        {label}
        {locked && lockNote ? <span className="lock-note">{lockNote}</span> : null}
      </span>
      <input
        type="checkbox"
        checked={on}
        disabled={locked}
        onChange={(event) => onToggle(event.target.checked)}
      />
    </label>
  )
}

function Choice({
  on,
  onClick,
  children,
}: {
  on: boolean
  onClick: () => void
  children: string
}) {
  return (
    <button type="button" className={on ? 'is-on' : ''} onClick={onClick}>
      {children}
    </button>
  )
}
