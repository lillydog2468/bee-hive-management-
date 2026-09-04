import { type ReactNode, useEffect } from 'react'

export function Sheet({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="sheet-root">
      <button className="sheet-backdrop" type="button" onClick={onClose} aria-label="Close" />
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
        <div className="sheet-handle" />
        <div className="sheet-head">
          <h2 id="sheet-title">{title}</h2>
          <button className="text-btn" type="button" onClick={onClose}>
            Done
          </button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  )
}
