import { StoreProvider } from './state/Store.tsx'
import { useStore } from './state/context.ts'
import { HiveScreen } from './screens/HiveScreen.tsx'
import { HivesScreen } from './screens/HivesScreen.tsx'
import { MoreScreen } from './screens/MoreScreen.tsx'
import { SiteMapScreen } from './screens/SiteMapScreen.tsx'
import { SitesScreen } from './screens/SitesScreen.tsx'
import { StockScreen } from './screens/StockScreen.tsx'
import { UnusedScreen } from './screens/UnusedScreen.tsx'

function Routes() {
  const { route } = useStore()
  switch (route.page) {
    case 'unused':
      return <UnusedScreen />
    case 'stock':
      return <StockScreen typeId={route.typeId} />
    case 'sites':
      return <SitesScreen />
    case 'site':
      return <SiteMapScreen siteId={route.siteId} />
    case 'hives':
      return <HivesScreen />
    case 'hive':
      return <HiveScreen hiveId={route.hiveId} />
    case 'more':
      return <MoreScreen />
  }
}

export default function App() {
  return (
    <StoreProvider>
      <Routes />
    </StoreProvider>
  )
}
