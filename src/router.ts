export type Route =
  | { page: 'unused' }
  | { page: 'stock'; typeId: string }
  | { page: 'sites' }
  | { page: 'site'; siteId: string }
  | { page: 'hives' }
  | { page: 'hive'; hiveId: string }
  | { page: 'more' }

export function parseHash(hash: string): Route {
  const path = hash.replace(/^#/, '').replace(/^\/+/, '')
  const parts = path.split('/').filter(Boolean)
  if (parts.length === 0 || parts[0] === 'unused') return { page: 'unused' }
  if (parts[0] === 'sites' && parts[1]) return { page: 'site', siteId: parts[1] }
  if (parts[0] === 'sites') return { page: 'sites' }
  if (parts[0] === 'hives' && parts[1]) return { page: 'hive', hiveId: parts[1] }
  if (parts[0] === 'hives') return { page: 'hives' }
  if (parts[0] === 'kit' && parts[1]) return { page: 'stock', typeId: parts[1] }
  if (parts[0] === 'more') return { page: 'more' }
  return { page: 'unused' }
}

export function toHash(route: Route): string {
  switch (route.page) {
    case 'unused':
      return '#/unused'
    case 'stock':
      return `#/kit/${route.typeId}`
    case 'sites':
      return '#/sites'
    case 'site':
      return `#/sites/${route.siteId}`
    case 'hives':
      return '#/hives'
    case 'hive':
      return `#/hives/${route.hiveId}`
    case 'more':
      return '#/more'
  }
}

export function navigate(route: Route): void {
  const next = toHash(route)
  if (window.location.hash !== next) {
    window.location.hash = next
  }
}
