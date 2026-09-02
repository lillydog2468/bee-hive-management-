import { useEffect, useMemo, useReducer, useState, type ReactNode } from 'react'
import { tallyInUse } from '../domain/inventory.ts'
import { loadPhotos, savePhotos, type PhotoStore } from '../domain/photos.ts'
import { reducer } from '../domain/reducer.ts'
import { loadState, saveState } from '../domain/storage.ts'
import { navigate, parseHash, type Route } from '../router.ts'
import { StoreContext } from './context.ts'

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, null, loadState)
  const [photos, setPhotos] = useState<PhotoStore>(loadPhotos)
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash))

  useEffect(() => {
    saveState(state)
  }, [state])

  useEffect(() => {
    savePhotos(photos)
  }, [photos])

  useEffect(() => {
    const onHash = () => setRoute(parseHash(window.location.hash))
    window.addEventListener('hashchange', onHash)
    if (!window.location.hash) window.location.hash = '#/unused'
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const inUse = useMemo(() => tallyInUse(state.hives), [state.hives])

  useEffect(() => {
    document.title = state.appName
  }, [state.appName])

  const value = useMemo(
    () => ({
      state,
      dispatch,
      inUse,
      route,
      go: navigate,
      photos,
      setTypePhoto: (typeId: string, dataUrl: string | null) => {
        setPhotos((current) => {
          const types = { ...current.types }
          if (dataUrl) types[typeId] = dataUrl
          else delete types[typeId]
          return { ...current, types }
        })
      },
      setHivePhoto: (hiveId: string, dataUrl: string | null) => {
        setPhotos((current) => {
          const hives = { ...current.hives }
          if (dataUrl) hives[hiveId] = dataUrl
          else delete hives[hiveId]
          return { ...current, hives }
        })
      },
    }),
    [state, inUse, route, photos],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}
