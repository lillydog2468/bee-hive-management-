import { createContext, useContext, type Dispatch } from 'react'
import type { Action } from '../domain/reducer.ts'
import type { AppState } from '../domain/types.ts'
import type { Route } from '../router.ts'

export type Store = {
  state: AppState
  dispatch: Dispatch<Action>
  inUse: Record<string, number>
  route: Route
  go: (route: Route) => void
}

export const StoreContext = createContext<Store | null>(null)

export function useStore(): Store {
  const store = useContext(StoreContext)
  if (!store) throw new Error('useStore must be used within StoreProvider')
  return store
}
