import { useState } from 'react'
import { Layout } from '../components/Layout.tsx'
import { Sheet } from '../components/Sheet.tsx'
import { useStore } from '../state/context.ts'

export function SitesScreen() {
  const { state, dispatch, go } = useStore()
  const [addOpen, setAddOpen] = useState(false)
  const [yardName, setYardName] = useState('')

  return (
    <Layout
      title="Sites"
      subtitle="Home yard, above the garage, far side of the house — and any extra yards you add."
      actions={
        <button className="text-btn" type="button" onClick={() => setAddOpen(true)}>
          Add a yard
        </button>
      }
    >
      <ul className="site-list">
        {state.sites.map((site) => {
          const hives = state.hives.filter((hive) => hive.siteId === site.id)
          const pads = state.pads.filter(
            (pad) => pad.siteId === site.id && !pad.occupiedHiveId,
          )
          const bits: string[] = []
          const full = hives.filter((hive) => hive.kind === 'full-size').length
          const n4 = hives.filter((hive) => hive.kind === 'nuc-4').length
          const n5 = hives.filter((hive) => hive.kind === 'nuc-5').length
          if (full) bits.push(`${full} full-size hive${full === 1 ? '' : 's'}`)
          if (n4) bits.push(`${n4} four-frame nuc${n4 === 1 ? '' : 's'}`)
          if (n5) bits.push(`${n5} five-frame nuc${n5 === 1 ? '' : 's'}`)
          const fullPads = pads.filter((pad) => pad.size === 'full-size').length
          const nucPads = pads.filter((pad) => pad.size === 'nuc').length
          if (fullPads) bits.push(`${fullPads} empty full-size pad${fullPads === 1 ? '' : 's'}`)
          if (nucPads) bits.push(`${nucPads} empty nuc pad${nucPads === 1 ? '' : 's'}`)
          if (bits.length === 0) bits.push('Nothing placed yet')

          const points = site.shape.map((p) => `${p.x},${p.y}`).join(' ')

          return (
            <li key={site.id}>
              <button
                type="button"
                className="site-card"
                onClick={() => go({ page: 'site', siteId: site.id })}
              >
                <svg className="site-mini" viewBox="0 0 100 100" aria-hidden>
                  <polygon points={points} />
                </svg>
                <div>
                  <h2>{site.name}</h2>
                  <p>{site.summary}</p>
                  <p className="site-bits">{bits.join(' · ')}</p>
                </div>
              </button>
            </li>
          )
        })}
      </ul>
      {addOpen ? (
        <Sheet title="Add a yard" onClose={() => setAddOpen(false)}>
          <p className="sheet-lede">
            Name it yourself. The outline starts as a rectangle — tweak the
            shape and add empty pads on the aerial.
          </p>
          <label className="field">
            <span>Yard name</span>
            <input
              value={yardName}
              onChange={(event) => setYardName(event.target.value)}
              autoComplete="off"
              placeholder="e.g. the field name"
            />
          </label>
          <button
            className="primary"
            type="button"
            disabled={!yardName.trim()}
            onClick={() => {
              const id = `site-${crypto.randomUUID()}`
              dispatch({ type: 'add-site', id, name: yardName.trim() })
              setAddOpen(false)
              setYardName('')
              go({ page: 'site', siteId: id })
            }}
          >
            Add yard
          </button>
        </Sheet>
      ) : null}
    </Layout>
  )
}
