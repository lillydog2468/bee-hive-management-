import { useState } from 'react'
import { HiveGlyph } from './HiveGlyph.tsx'
import { Sheet } from './Sheet.tsx'
import { SiteMap } from './SiteMap.tsx'
import { HOME_YARD } from '../domain/seed.ts'
import { hiveKindLabel, padSizeLabel } from '../domain/names.ts'
import type { HiveKind, PadSize } from '../domain/types.ts'
import { useStore } from '../state/context.ts'

export function SiteMapPanel({
  siteId,
  selectedHiveId,
  showSiteSwitch = false,
  onSelectSite,
}: {
  siteId: string
  selectedHiveId?: string | null
  showSiteSwitch?: boolean
  onSelectSite?: (siteId: string) => void
}) {
  const { state, dispatch, go } = useStore()
  const site = state.sites.find((item) => item.id === siteId)
  const [editShape, setEditShape] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [padId, setPadId] = useState<string | null>(null)
  const [pendingHiveId, setPendingHiveId] = useState<string | null>(null)
  const [pendingPadId, setPendingPadId] = useState<string | null>(null)

  if (!site) {
    return <p className="lede">That site is not in this list.</p>
  }

  const hives = state.hives.filter((hive) => hive.siteId === site.id)
  const pads = state.pads.filter((pad) => pad.siteId === site.id)
  const openPad = pads.find((pad) => pad.id === padId)
  const pendingHive = state.hives.find((hive) => hive.id === pendingHiveId)
  const pendingPad = state.pads.find((pad) => pad.id === pendingPadId)
  const movable = state.hives.filter((hive) => hive.padId !== padId)

  function addHive(kind: HiveKind, onPad?: string) {
    dispatch({
      type: 'add-hive',
      id: crypto.randomUUID(),
      siteId: site!.id,
      kind,
      x: onPad ? (pads.find((p) => p.id === onPad)?.x ?? 50) : 50,
      y: onPad ? (pads.find((p) => p.id === onPad)?.y ?? 48) : 48,
      padId: onPad,
    })
    setAddOpen(false)
    setPadId(null)
  }

  function addPad(size: PadSize) {
    dispatch({
      type: 'add-pad',
      id: crypto.randomUUID(),
      siteId: site!.id,
      size,
      x: size === 'nuc' ? 18 : 40,
      y: 40,
    })
    setAddOpen(false)
  }

  function moveVertex(index: number, point: { x: number; y: number }) {
    const shape = site!.shape.map((item, i) => (i === index ? point : item))
    dispatch({ type: 'set-shape', siteId: site!.id, shape })
  }

  return (
    <div className="map-panel">
      {showSiteSwitch ? (
        <div className="site-switch" role="tablist" aria-label="Sites">
          {state.sites.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={item.id === site.id}
              className={item.id === site.id ? 'is-on' : ''}
              onClick={() => onSelectSite?.(item.id)}
            >
              {item.name}
            </button>
          ))}
        </div>
      ) : null}

      <div className="map-panel-head">
        {showSiteSwitch ? (
          <div>
            <p className="spotlight-kicker">Aerial</p>
            <h2>{site.name}</h2>
          </div>
        ) : (
          <div />
        )}
        <div className="map-toolbar">
          <button
            type="button"
            className={editShape ? 'chip is-on' : 'chip'}
            onClick={() => {
              setEditShape((value) => !value)
              setRemoving(false)
            }}
          >
            {editShape ? 'Done tweaking shape' : 'Tweak yard shape'}
          </button>
          <button
            type="button"
            className={removing ? 'chip is-on' : 'chip'}
            onClick={() => {
              setRemoving((value) => !value)
              setEditShape(false)
            }}
          >
            {removing ? 'Done removing' : 'Remove'}
          </button>
          <button className="chip" type="button" onClick={() => setAddOpen(true)}>
            Add
          </button>
        </div>
      </div>

      {removing ? (
        <p className="hint">
          Tap a hive or an empty pad to delete it. You will be asked to confirm.
        </p>
      ) : editShape ? (
        <p className="hint">
          Drag the corners of the outline. The home yard starts as an L you can
          change as the ground changes.
        </p>
      ) : (
        <p className="hint">
          Hold and drag a marker. A short tap opens it. Glyphs follow Keith’s key.
          Empty dashed pads are free positions.
        </p>
      )}

      {site.id === HOME_YARD ? (
        <ul className="map-key" aria-label="Map key">
          <li>
            <HiveGlyph kind="nuc-4" boxCount={1} />
            <span>Nuc 1 box</span>
          </li>
          <li>
            <HiveGlyph kind="nuc-4" boxCount={2} />
            <span>Nuc 2 box</span>
          </li>
          <li>
            <HiveGlyph kind="nuc-4" boxCount={3} />
            <span>Nuc 3 box</span>
          </li>
          <li>
            <HiveGlyph kind="full-size" boxCount={1} />
            <span>Large 1 box</span>
          </li>
          <li>
            <HiveGlyph kind="full-size" boxCount={2} />
            <span>Large 2 box</span>
          </li>
        </ul>
      ) : null}

      <div className="map-stage">
        <SiteMap
          site={site}
          hives={hives}
          pads={pads}
          editShape={editShape}
          selectedHiveId={selectedHiveId}
          onMoveHive={(hiveId, x, y) => dispatch({ type: 'set-hive-pos', hiveId, x, y })}
          onMovePad={(id, x, y) => dispatch({ type: 'set-pad-pos', padId: id, x, y })}
          onMoveVertex={moveVertex}
          onOpenHive={(id) =>
            removing ? setPendingHiveId(id) : go({ page: 'hive', hiveId: id })
          }
          onOpenPad={(id) => (removing ? setPendingPadId(id) : setPadId(id))}
        />
      </div>

      {addOpen ? (
        <Sheet title="Add to this site" onClose={() => setAddOpen(false)}>
          <p className="sheet-lede">
            Empty pads give a split somewhere to go, and leave room as the yard
            grows. Hives occupy unused-pool kit when you set a stack. Every hive
            needs a bottom board, an inner cover and a lid. On the L-yard, hives
            and kit can all be moved — they are not glued to a pad. Garage pads
            keep their own bottom board and wooden lid, even when empty, and
            those cannot be used anywhere else. Extra pads you add here do not
            invent more bottoms or lids.
          </p>
          <div className="choice-list">
            <button type="button" onClick={() => addPad('full-size')}>
              Empty full-size pad
            </button>
            <button type="button" onClick={() => addPad('nuc')}>
              Empty nuc pad
            </button>
            <button type="button" onClick={() => addHive('full-size')}>
              Full-size hive
            </button>
            <button type="button" onClick={() => addHive('nuc-4')}>
              4-frame nuc
            </button>
            <button type="button" onClick={() => addHive('nuc-5')}>
              5-frame nuc
            </button>
          </div>
        </Sheet>
      ) : null}

      {openPad ? (
        <Sheet title={openPad.name} onClose={() => setPadId(null)}>
          <p className="sheet-lede">
            Empty {padSizeLabel(openPad.size).toLowerCase()}.
            {openPad.lockedBottomAndLid
              ? ' This pad already has a bottom board and wooden lid. They stay here even while the pad is empty, and they are not unused kit.'
              : ''}{' '}
            Place a hive here, move one across, or remove the pad.
          </p>
          <div className="choice-list">
            <button type="button" onClick={() => addHive('full-size', openPad.id)}>
              New full-size hive on this pad
            </button>
            <button type="button" onClick={() => addHive('nuc-4', openPad.id)}>
              New 4-frame nuc on this pad
            </button>
            <button type="button" onClick={() => addHive('nuc-5', openPad.id)}>
              New 5-frame nuc on this pad
            </button>
          </div>
          {movable.length > 0 ? (
            <>
              <h3 className="sheet-sub">Move an existing hive here</h3>
              <div className="choice-list">
                {movable.map((hive) => (
                  <button
                    key={hive.id}
                    type="button"
                    onClick={() => {
                      dispatch({
                        type: 'place-hive-on-pad',
                        hiveId: hive.id,
                        padId: openPad.id,
                      })
                      setPadId(null)
                    }}
                  >
                    {hive.name}
                    <span>{hiveKindLabel(hive.kind)}</span>
                  </button>
                ))}
              </div>
            </>
          ) : null}
          <button
            className="danger-text"
            type="button"
            onClick={() => {
              setPendingPadId(openPad.id)
              setPadId(null)
            }}
          >
            Remove pad
          </button>
        </Sheet>
      ) : null}

      {pendingHive ? (
        <Sheet title="Remove hive?" onClose={() => setPendingHiveId(null)}>
          <p className="sheet-lede">
            Unused-pool kit on {pendingHive.name} returns to unused. A garage
            pad’s bottom board and wooden lid stay on that pad.
          </p>
          <button
            className="danger"
            type="button"
            onClick={() => {
              dispatch({ type: 'remove-hive', hiveId: pendingHive.id })
              setPendingHiveId(null)
              setRemoving(false)
            }}
          >
            Remove hive
          </button>
        </Sheet>
      ) : null}

      {pendingPad ? (
        <Sheet title="Remove pad?" onClose={() => setPendingPadId(null)}>
          <p className="sheet-lede">
            {pendingPad.lockedBottomAndLid
              ? 'This pad’s bottom board and wooden lid stay with the pad. They are not unused kit, and they will not be added to unused when the pad is removed.'
              : 'This empty pad will be removed.'}
          </p>
          <button
            className="danger"
            type="button"
            onClick={() => {
              dispatch({ type: 'remove-pad', padId: pendingPad.id })
              setPendingPadId(null)
              setRemoving(false)
            }}
          >
            Remove pad
          </button>
        </Sheet>
      ) : null}
    </div>
  )
}
