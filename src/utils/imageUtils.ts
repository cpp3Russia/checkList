export async function compressImage(
  file: File,
  options: {
    maxWidth?: number
    maxHeight?: number
    quality?: number
    outputFormat?: 'image/jpeg' | 'image/png' | 'image/webp'
  } = {}
): Promise<Blob> {
  const {
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.8,
    outputFormat = 'image/jpeg'
  } = options
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }
        }
        
        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('无法获取 canvas context'))
          return
        }
        
        ctx.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('压缩失败'))
            }
          },
          outputFormat,
          quality
        )
      }
      
      img.onerror = () => reject(new Error('图片加载失败'))
    }
    
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsDataURL(file)
  })
}

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsDataURL(file)
  })
}

export function validateImageFile(file: File): {
  valid: boolean
  error?: string
} {
  const MAX_SIZE = 10 * 1024 * 1024
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: '不支持的图片格式'
    }
  }
  
  if (file.size > MAX_SIZE) {
    return {
      valid: false,
      error: '图片文件过大'
    }
  }
  
  return { valid: true }
}

export async function createThumbnail(
  file: File,
  size: number = 100
): Promise<string> {
  const compressedBlob = await compressImage(file, {
    maxWidth: size,
    maxHeight: size,
    quality: 0.7
  })
  
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.readAsDataURL(compressedBlob)
  })
}
