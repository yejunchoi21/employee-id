import { useEffect, useId, useRef, useState } from 'react'
import { portraitPlaceholder } from '../data/employee'
import {
  MAX_PORTRAIT_BYTES,
  PortraitProcessingError,
  processPortraitFile,
} from '../utils/processPortrait'
import './PortraitUploadField.css'

interface PortraitUploadFieldProps {
  portraitBlob: Blob | null
  previewUrl: string | null
  onPortraitChange: (next: {
    blob: Blob | null
    previewUrl: string | null
  }) => void
  onProcessingChange?: (isProcessing: boolean) => void
  disabled?: boolean
}

function PortraitUploadField({
  portraitBlob,
  previewUrl,
  onPortraitChange,
  onProcessingChange,
  disabled = false,
}: PortraitUploadFieldProps) {
  const fieldId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const ownedUrlsRef = useRef(new Set<string>())
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [fileLabel, setFileLabel] = useState<string | null>(null)

  useEffect(() => {
    onProcessingChange?.(isProcessing)
  }, [isProcessing, onProcessingChange])

  useEffect(() => {
    const ownedUrls = ownedUrlsRef.current
    return () => {
      for (const url of ownedUrls) {
        URL.revokeObjectURL(url)
      }
      ownedUrls.clear()
    }
  }, [])

  const revokeOwned = (url: string | null | undefined) => {
    if (!url) return
    if (!ownedUrlsRef.current.has(url)) return
    URL.revokeObjectURL(url)
    ownedUrlsRef.current.delete(url)
  }

  const clearPortrait = () => {
    revokeOwned(previewUrl)
    setFileLabel(null)
    setError(null)
    onPortraitChange({ blob: null, previewUrl: null })
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const handleFile = async (file: File | undefined) => {
    if (!file) return

    setError(null)
    setIsProcessing(true)

    try {
      const processed = await processPortraitFile(file)
      revokeOwned(previewUrl)
      const nextPreview = URL.createObjectURL(processed)
      ownedUrlsRef.current.add(nextPreview)
      setFileLabel(file.name)
      onPortraitChange({ blob: processed, previewUrl: nextPreview })
    } catch (processingError) {
      const message =
        processingError instanceof PortraitProcessingError
          ? processingError.message
          : 'Could not process that file. Try a PNG, JPEG, or unlocked PDF under 5 MB.'
      setError(message)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const hasPhoto = Boolean(previewUrl || portraitBlob)

  return (
    <div className="portrait-upload">
      <div className="portrait-upload__header">
        <label htmlFor={fieldId}>Employee photo</label>
        <p className="portrait-upload__meta">
          PNG, JPEG, or PDF · max {Math.round(MAX_PORTRAIT_BYTES / (1024 * 1024))}{' '}
          MB
        </p>
      </div>

      <div className="portrait-upload__body">
        <div className="portrait-upload__preview-wrap">
          <img
            className="portrait-upload__preview"
            src={previewUrl ?? portraitPlaceholder}
            alt={
              previewUrl
                ? 'Selected employee photo preview'
                : 'Default employee portrait placeholder'
            }
          />
        </div>

        <div className="portrait-upload__controls">
          <input
            ref={inputRef}
            id={fieldId}
            type="file"
            accept="image/png,image/jpeg,.png,.jpg,.jpeg,application/pdf,.pdf"
            disabled={disabled || isProcessing}
            onChange={(event) => {
              void handleFile(event.target.files?.[0])
            }}
          />

          <p className="portrait-upload__help">
            For PDFs, we use the first page.
          </p>

          {fileLabel ? (
            <p className="portrait-upload__file">{fileLabel}</p>
          ) : null}

          {isProcessing ? (
            <p className="portrait-upload__status" role="status">
              Processing photo…
            </p>
          ) : null}

          {error ? (
            <p className="portrait-upload__error" role="alert">
              {error}
            </p>
          ) : null}

          <div className="portrait-upload__actions">
            <button
              type="button"
              className="portrait-upload__button"
              disabled={disabled || isProcessing}
              onClick={() => inputRef.current?.click()}
            >
              {hasPhoto ? 'Replace photo' : 'Choose photo'}
            </button>
            {hasPhoto ? (
              <button
                type="button"
                className="portrait-upload__button portrait-upload__button--secondary"
                disabled={disabled || isProcessing}
                onClick={clearPortrait}
              >
                Remove photo
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PortraitUploadField
