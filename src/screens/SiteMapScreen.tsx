import { Layout } from '../components/Layout.tsx'
import { SiteMapPanel } from '../components/SiteMapPanel.tsx'
import { useStore } from '../state/context.ts'

export function SiteMapScreen({ siteId }: { siteId: string }) {
  const { state } = useStore()
  const site = state.sites.find((item) => item.id === siteId)

  if (!site) {
    return (
      <Layout title="Unknown site" back={{ label: 'Sites', href: '#/sites' }}>
        <p className="lede">That site is not in this list.</p>
      </Layout>
    )
  }

  return (
    <Layout
      title={site.name}
      subtitle={`${site.summary} Drag markers to reposition. Tap a hive to open it.`}
      back={{ label: 'Sites', href: '#/sites' }}
    >
      <SiteMapPanel siteId={siteId} />
    </Layout>
  )
}
