import { Layout } from '../components/Layout.tsx'
import { useStore } from '../state/context.ts'

export function SitesScreen() {
  const { state, go } = useStore()

  return (
    <Layout
      title="Sites"
      subtitle="Three places: the L-shaped home yard, the space above the garage, and the far side of the house."
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
    </Layout>
  )
}
