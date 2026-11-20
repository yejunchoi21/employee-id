import { useEffect, useId, useRef, useState, type ChangeEvent } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material'
import { portraitPlaceholder } from '../data/employee'
import {
  MAX_PORTRAIT_BYTES,
  PortraitProcessingError,
  processPortraitFile,
} from '../utils/processPortrait'

const visuallyHiddenInput = {
  position: 'absolute',
  width: 1,
  height: 1,
  p: 0,
  m: -1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
} as const

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
    <Box>
      <Stack
        direction="row"
        spacing={1}
        useFlexGap
        sx={{ alignItems: 'baseline', flexWrap: 'wrap', mb: 1 }}
      >
        <Typography variant="subtitle1" component="label" htmlFor={fieldId}>
          Employee photo
        </Typography>
        <Typography variant="caption" color="text.secondary">
          PNG, JPEG, or PDF · max {Math.round(MAX_PORTRAIT_BYTES / (1024 * 1024))}{' '}
          MB
        </Typography>
      </Stack>

      <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
        <Avatar
          variant="rounded"
          src={previewUrl ?? portraitPlaceholder}
          alt={
            previewUrl
              ? 'Selected employee photo preview'
              : 'Default employee portrait placeholder'
          }
          sx={{ width: 96, height: 96, flexShrink: 0, bgcolor: 'action.hover' }}
        />

        <Stack spacing={1} sx={{ minWidth: 0, flex: 1 }}>
          <Box
            component="input"
            ref={inputRef}
            id={fieldId}
            type="file"
            accept="image/png,image/jpeg,.png,.jpg,.jpeg,application/pdf,.pdf"
            disabled={disabled || isProcessing}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              void handleFile(event.target.files?.[0])
            }}
            sx={visuallyHiddenInput}
          />

          <Typography variant="caption" color="text.secondary">
            For PDFs, we use the first page.
          </Typography>

          {fileLabel ? (
            <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
              {fileLabel}
            </Typography>
          ) : null}

          {isProcessing ? (
            <Stack
              direction="row"
              spacing={1}
              role="status"
              sx={{ alignItems: 'center' }}
            >
              <CircularProgress size={16} />
              <Typography variant="body2">Processing photo…</Typography>
            </Stack>
          ) : null}

          {error ? <Alert severity="error">{error}</Alert> : null}

          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
            <Button
              type="button"
              variant="outlined"
              size="small"
              disabled={disabled || isProcessing}
              onClick={() => inputRef.current?.click()}
            >
              {hasPhoto ? 'Replace photo' : 'Choose photo'}
            </Button>
            {hasPhoto ? (
              <Button
                type="button"
                variant="text"
                size="small"
                disabled={disabled || isProcessing}
                onClick={clearPortrait}
              >
                Remove photo
              </Button>
            ) : null}
          </Stack>
        </Stack>
      </Stack>
    </Box>
  )
}

export default PortraitUploadField
