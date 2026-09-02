import { useEffect, useState } from 'react'

/** Laptop and iPad landscape — not the phone column. */
export const WIDE_QUERY = '(min-width: 56rem)'

export function useWideLayout(): boolean {
  const [wide, setWide] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(WIDE_QUERY).matches : false,
  )

  useEffect(() => {
    const media = window.matchMedia(WIDE_QUERY)
    const onChange = () => setWide(media.matches)
    onChange()
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  return wide
}
