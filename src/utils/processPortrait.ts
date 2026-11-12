export const MAX_PORTRAIT_BYTES = 5 * 1024 * 1024
export const MAX_PORTRAIT_EDGE = 1200

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47]
const JPEG_SIGNATURE = [0xff, 0xd8, 0xff]
const PDF_SIGNATURE = [0x25, 0x50, 0x44, 0x46] // %PDF

export type PortraitKind = 'png' | 'jpeg' | 'pdf'

export class PortraitProcessingError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PortraitProcessingError'
  }
}

function extensionOf(file: File) {
  const parts = file.name.toLowerCase().split('.')
  return parts.length > 1 ? parts.at(-1) ?? '' : ''
}

function matchesSignature(bytes: Uint8Array, signature: number[]) {
  if (bytes.length < signature.length) return false
  return signature.every((value, index) => bytes[index] === value)
}

async function readHeader(file: File, length = 8) {
  const buffer = await file.slice(0, length).arrayBuffer()
  return new Uint8Array(buffer)
}

export async function detectPortraitKind(file: File): Promise<PortraitKind> {
  const extension = extensionOf(file)
  const header = await readHeader(file)
  const mime = file.type.toLowerCase()

  const isPng =
    matchesSignature(header, PNG_SIGNATURE) &&
    (extension === 'png' || mime === 'image/png' || mime === '')
  const isJpeg =
    matchesSignature(header, JPEG_SIGNATURE) &&
    (extension === 'jpg' ||
      extension === 'jpeg' ||
      mime === 'image/jpeg' ||
      mime === '')
  const isPdf =
    matchesSignature(header, PDF_SIGNATURE) &&
    (extension === 'pdf' || mime === 'application/pdf' || mime === '')

  if (isPng) return 'png'
  if (isJpeg) return 'jpeg'
  if (isPdf) return 'pdf'

  if (['png', 'jpg', 'jpeg', 'pdf'].includes(extension)) {
    throw new PortraitProcessingError(
      'The file extension does not match the file contents. Choose a valid PNG, JPEG, or PDF.',
    )
  }

  throw new PortraitProcessingError(
    'Only PNG, JPEG, and PDF files are supported for employee photos.',
  )
}

export async function validatePortraitFile(file: File): Promise<PortraitKind> {
  if (file.size <= 0) {
    throw new PortraitProcessingError('The selected file is empty.')
  }

  if (file.size > MAX_PORTRAIT_BYTES) {
    throw new PortraitProcessingError(
      'That file is larger than the 5 MB limit. Choose a smaller PNG, JPEG, or PDF.',
    )
  }

  return detectPortraitKind(file)
}

function canvasToJpegBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(
            new PortraitProcessingError(
              'Could not process the image in this browser.',
            ),
          )
          return
        }
        resolve(blob)
      },
      'image/jpeg',
      0.88,
    )
  })
}

function drawImageToCanvas(
  source: CanvasImageSource,
  width: number,
  height: number,
) {
  const scale = Math.min(1, MAX_PORTRAIT_EDGE / Math.max(width, height))
  const targetWidth = Math.max(1, Math.round(width * scale))
  const targetHeight = Math.max(1, Math.round(height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight
  const context = canvas.getContext('2d')
  if (!context) {
    throw new PortraitProcessingError(
      'Could not process the image in this browser.',
    )
  }
  context.drawImage(source, 0, 0, targetWidth, targetHeight)
  return canvas
}

async function processRasterImage(file: File): Promise<Blob> {
  const objectUrl = URL.createObjectURL(file)
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image()
      element.onload = () => resolve(element)
      element.onerror = () =>
        reject(
          new PortraitProcessingError(
            'Could not read that image. Try another PNG or JPEG file.',
          ),
        )
      element.src = objectUrl
    })

    const canvas = drawImageToCanvas(
      image,
      image.naturalWidth || image.width,
      image.naturalHeight || image.height,
    )
    return canvasToJpegBlob(canvas)
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

async function processPdfFirstPage(file: File): Promise<Blob> {
  const [{ getDocument, GlobalWorkerOptions }, pdfWorker] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ])

  GlobalWorkerOptions.workerSrc = pdfWorker.default
  const data = await file.arrayBuffer()

  try {
    const loadingTask = getDocument({
      data,
      useSystemFonts: true,
    })

    const pdf = await loadingTask.promise
    const page = await pdf.getPage(1)
    const viewport = page.getViewport({ scale: 1 })
    const scale = Math.min(
      1,
      MAX_PORTRAIT_EDGE / Math.max(viewport.width, viewport.height),
    )
    const scaledViewport = page.getViewport({ scale: Math.max(scale, 0.5) })
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.floor(scaledViewport.width))
    canvas.height = Math.max(1, Math.floor(scaledViewport.height))
    const context = canvas.getContext('2d')
    if (!context) {
      throw new PortraitProcessingError(
        'Could not process the PDF in this browser.',
      )
    }

    await page.render({
      canvas,
      canvasContext: context,
      viewport: scaledViewport,
    }).promise

    return canvasToJpegBlob(canvas)
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : ''
    if (
      message.includes('password') ||
      message.includes('encrypted') ||
      (error &&
        typeof error === 'object' &&
        'name' in error &&
        String((error as { name: unknown }).name)
          .toLowerCase()
          .includes('password'))
    ) {
      throw new PortraitProcessingError(
        'That PDF is password-protected. Export an unlocked PDF or use a PNG/JPEG instead.',
      )
    }

    if (error instanceof PortraitProcessingError) {
      throw error
    }

    throw new PortraitProcessingError(
      'Could not read that PDF. Make sure it is a valid, unlocked PDF and try again.',
    )
  }
}

export async function processPortraitFile(file: File): Promise<Blob> {
  const kind = await validatePortraitFile(file)
  if (kind === 'pdf') {
    return processPdfFirstPage(file)
  }
  return processRasterImage(file)
}
