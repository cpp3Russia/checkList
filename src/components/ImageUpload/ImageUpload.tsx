import { useRef, useState } from 'react'
import {
  Alert,
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
  ImageList,
  ImageListItem,
  Stack
} from '@mui/material'
import {
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Preview as PreviewIcon
} from '@mui/icons-material'
import { compressImage, fileToBase64, validateImageFile } from '@/utils/imageUtils'
import './ImageUpload.scss'

interface ImageUploadProps {
  onImagesChange: (images: string[]) => void
  images?: string[]
  maxImages?: number
  disabled?: boolean
}

export function ImageUpload({
  onImagesChange,
  images = [],
  maxImages = 5,
  disabled = false
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files
    if (!files) return

    setError(null)
    setUploading(true)

    try {
      const newImages: string[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const validation = validateImageFile(file)

        if (!validation.valid) {
          setError(validation.error || 'File validation failed')
          continue
        }

        if (images.length + newImages.length >= maxImages) {
          setError(`You can upload up to ${maxImages} images`)
          break
        }

        try {
          const compressedBlob = await compressImage(file, {
            maxWidth: 1200,
            maxHeight: 1200,
            quality: 0.8,
            outputFormat: 'image/jpeg'
          })

          const base64 = await fileToBase64(new File([compressedBlob], file.name))
          newImages.push(base64)
        } catch (err) {
          console.error('Image compression failed:', err)
          setError('Some images could not be processed')
        }
      }

      if (newImages.length > 0) {
        onImagesChange([...images, ...newImages])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      console.error('Upload error:', err)
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index))
  }

  const canUpload = !disabled && images.length < maxImages && !uploading

  return (
    <Box className="img-up">
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        disabled={!canUpload}
      />

      <Box
        className="img-up__dropzone"
        sx={{
          border: '2px dashed',
          borderColor: canUpload ? 'primary.main' : 'text.disabled',
          borderRadius: 2,
          p: 3,
          textAlign: 'center',
          backgroundColor: canUpload ? 'action.hover' : 'action.disabled',
          transition: 'all 0.3s ease',
          cursor: canUpload ? 'pointer' : 'default',
          '&:hover': canUpload
            ? {
                borderColor: 'primary.dark',
                backgroundColor: 'action.selected'
              }
            : {}
        }}
        onClick={() => canUpload && fileInputRef.current?.click()}
      >
        {uploading ? (
          <Stack alignItems="center" spacing={1}>
            <CircularProgress size={40} />
            <span>Uploading...</span>
          </Stack>
        ) : (
          <Stack alignItems="center" spacing={1}>
            <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main' }} />
            <span>{canUpload ? 'Click to upload images' : 'Upload limit reached'}</span>
            <span style={{ fontSize: '0.875rem', color: 'var(--mui-palette-text-secondary)' }}>
              JPG, PNG, WebP. Up to 10MB each.
            </span>
          </Stack>
        )}
      </Box>

      <Box className="img-up__counter" sx={{ mt: 1, fontSize: '0.875rem', color: 'text.secondary' }}>
        {images.length} / {maxImages} uploaded
      </Box>

      {images.length > 0 && (
        <Box className="img-up__gallery" sx={{ mt: 3 }}>
          <ImageList cols={3} gap={8} sx={{ width: '100%' }}>
            {images.map((image, index) => (
              <ImageListItem key={index} sx={{ position: 'relative' }}>
                <img
                  src={image}
                  alt={`Preview ${index + 1}`}
                  style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: 2 }}
                />
                <Stack
                  direction="row"
                  spacing={0.5}
                  sx={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    borderRadius: 1,
                    p: 0.5
                  }}
                >
                  <IconButton
                    size="small"
                    sx={{ color: 'white' }}
                    onClick={() => {
                      setPreviewImage(image)
                      setPreviewOpen(true)
                    }}
                  >
                    <PreviewIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    sx={{ color: 'white' }}
                    onClick={() => handleRemoveImage(index)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </ImageListItem>
            ))}
          </ImageList>
        </Box>
      )}

      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="sm" fullWidth>
        <DialogContent>
          {previewImage && <img src={previewImage} alt="Preview" style={{ width: '100%', borderRadius: 2 }} />}
        </DialogContent>
      </Dialog>
    </Box>
  )
}
