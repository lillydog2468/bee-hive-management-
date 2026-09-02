export const PHOTOS_KEY = 'hives.photos.v1'

export type PhotoStore = {
  types: Record<string, string>
  hives: Record<string, string>
}

export function emptyPhotos(): PhotoStore {
  return { types: {}, hives: {} }
}

export function loadPhotos(): PhotoStore {
  try {
    const raw = localStorage.getItem(PHOTOS_KEY)
    if (!raw) return emptyPhotos()
    const parsed = JSON.parse(raw) as Partial<PhotoStore>
    return {
      types: parsed.types && typeof parsed.types === 'object' ? parsed.types : {},
      hives: parsed.hives && typeof parsed.hives === 'object' ? parsed.hives : {},
    }
  } catch {
    return emptyPhotos()
  }
}

export function savePhotos(photos: PhotoStore): void {
  localStorage.setItem(PHOTOS_KEY, JSON.stringify(photos))
}

const MAX_EDGE = 480

export function resizeImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      const scale = Math.min(1, MAX_EDGE / Math.max(image.width, image.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(image.width * scale))
      canvas.height = Math.max(1, Math.round(image.height * scale))
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        URL.revokeObjectURL(url)
        reject(new Error('Could not read that picture'))
        return
      }
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.82))
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read that picture'))
    }
    image.src = url
  })
}
