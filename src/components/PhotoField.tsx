import { useRef, type ChangeEvent } from 'react'
import { resizeImageFile } from '../domain/photos.ts'

export function PhotoField({
  photo,
  onChange,
  onRemove,
  addLabel = 'Add a photo',
}: {
  photo?: string
  onChange: (dataUrl: string) => void
  onRemove: () => void
  addLabel?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  async function onPick(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      onChange(await resizeImageFile(file))
    } catch {
      // Leave the existing picture in place if the file cannot be read.
    }
  }

  return (
    <div className="photo-field">
      <input
        ref={inputRef}
        className="photo-input"
        type="file"
        accept="image/*"
        onChange={(event) => void onPick(event)}
      />
      {photo ? (
        <div className="photo-actions">
          <button
            type="button"
            className="chip"
            onClick={() => inputRef.current?.click()}
          >
            Replace photo
          </button>
          <button type="button" className="text-btn" onClick={onRemove}>
            Remove photo
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="chip"
          onClick={() => inputRef.current?.click()}
        >
          {addLabel}
        </button>
      )}
    </div>
  )
}
