import { useState } from 'react'
import { Layout } from '../components/Layout.tsx'
import { Sheet } from '../components/Sheet.tsx'
import { SiteMap } from '../components/SiteMap.tsx'
import { hiveKindLabel, padSizeLabel } from '../domain/names.ts'
import type { HiveKind, PadSize } from '../domain/types.ts'
import { useStore } from '../state/context.ts'

export function SiteMapScreen({ siteId }: { siteId: string }) {
  const { state, dispatch, go } = useStore()
  const site = state.sites.find((item) => item.id === siteId)
  const [editShape, setEditShape] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [padId, setPadId] = useState<string | null>(null)

  if (!site) {
    return (
      <Layout title="Unknown site" back={{ label: 'Sites', href: '#/sites' }}>
        <p className="lede">That site is not in this list.</p>
      </Layout>
    )
  }

  const hives = state.hives.filter((hive) => hive.siteId === site.id)
  const pads = state.pads.filter((pad) => pad.siteId === site.id)
  const openPad = pads.find((pad) => pad.id === padId)
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

  return (
    <Layout
      title={site.name}
      subtitle={`${site.summary} Drag markers to reposition. Tap a hive to open it.`}
      back={{ label: 'Sites', href: '#/sites' }}
      actions={
        <button className="text-btn" type="button" onClick={() => setAddOpen(true)}>
          Add
        </button>
      }
    >
      <div className="map-toolbar">
        <button
          type="button"
          className={editShape ? 'chip is-on' : 'chip'}
          onClick={() => setEditShape((value) => !value)}
        >
          {editShape ? 'Done tweaking shape' : 'Tweak yard shape'}
        </button>
      </div>

      {editShape ? (
        <p className="hint">Drag the corners of the outline. The home yard starts as an L you can change as the ground changes.</p>
      ) : (
        <p className="hint">Hold and drag a marker. A short tap opens it.</p>
      )}

      <SiteMap
        site={site}
        hives={hives}
        pads={pads}
        editShape={editShape}
        onMoveHive={(hiveId, x, y) =>
          dispatch({ type: 'set-hive-pos', hiveId, x, y })
        }
        onMovePad={(id, x, y) => dispatch({ type: 'set-pad-pos', padId: id, x, y })}
        onMoveVertex={(index, point) => {
          const shape = site.shape.map((item, i) => (i === index ? point : item))
          dispatch({ type: 'set-shape', siteId: site.id, shape })
        }}
        onOpenHive={(hiveId) => go({ page: 'hive', hiveId })}
        onOpenPad={(id) => setPadId(id)}
      />

      {addOpen ? (
        <Sheet title="Add to this site" onClose={() => setAddOpen(false)}>
          <p className="sheet-lede">
            Hives occupy unused-pool kit when you set a stack. Garage pads keep their own bottom board and wooden lid, even when empty. Extra pads you add here do not invent more bottoms or lids.
          </p>
          <div className="choice-list">
            <button type="button" onClick={() => addHive('full-size')}>
              Full-size hive
            </button>
            <button type="button" onClick={() => addHive('nuc-4')}>
              4-frame nuc
            </button>
            <button type="button" onClick={() => addHive('nuc-5')}>
              5-frame nuc
            </button>
            <button type="button" onClick={() => addPad('full-size')}>
              Empty full-size pad
            </button>
            <button type="button" onClick={() => addPad('nuc')}>
              Empty nuc pad
            </button>
          </div>
        </Sheet>
      ) : null}

      {openPad ? (
        <Sheet
          title={openPad.name}
          onClose={() => setPadId(null)}
        >
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
              dispatch({ type: 'remove-pad', padId: openPad.id })
              setPadId(null)
            }}
          >
            Remove pad
          </button>
        </Sheet>
      ) : null}
    </Layout>
  )
}
